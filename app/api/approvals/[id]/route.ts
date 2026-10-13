import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { parseEmailApprovalReason, isValidEmail } from "@/lib/email/approval-payload";
import { isEmailTestMode, sendApprovedEmail, validateEmailProviderConfig } from "@/providers/email/resend";
import { requirePrincipal } from "@/lib/auth-utils";

export const runtime = "nodejs";

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

async function writeAudit(workspaceId: string, action: string, approvalId: string, metadataJson: unknown, userId: string) {
  const prisma = getPrisma();
  await prisma.auditEvent.create({
    data: {
      workspaceId,
      action,
      actorType: "USER",
      actorId: userId,
      metadataJson: metadataJson as never
    }
  });
}

async function updateExecution(approval: { executionId: string | null; workspaceId: string }, status: "COMPLETED" | "CANCELLED" | "FAILED", approvalState: string, extra: Record<string, unknown> = {}) {
  if (!approval.executionId) return;
  const prisma = getPrisma();
  const existing = await prisma.execution.findFirst({
    where: { id: approval.executionId, workspaceId: approval.workspaceId }
  });
  if (!existing) return;
  const previous = asObject(existing.outputJson);
  await prisma.execution.update({
    where: { id: existing.id },
    data: {
      status,
      outputJson: { ...previous, approval: { status: approvalState, ...extra } } as never,
      errorMessage: status === "FAILED" ? String(extra.error ?? "Email delivery failed") : null,
      finishedAt: new Date()
    }
  });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { workspaceId, userId, role } = await requirePrincipal();

    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.json({ error: "Only workspace owners and administrators can approve or reject actions." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => ({})) as { action?: string };
    const action = body.action;
    
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "Action must be 'approve' or 'reject'." }, { status: 400 });
    }

    const prisma = getPrisma();
    const approval = await prisma.approval.findFirst({ where: { id, workspaceId } });
    if (!approval) return NextResponse.json({ error: "Approval request not found in your workspace." }, { status: 404 });

    if (action === "reject") {
      const claimed = await prisma.approval.updateMany({
        where: { id, workspaceId, status: "PENDING" },
        data: { status: "REJECTED", resolvedAt: new Date() }
      });
      if (claimed.count !== 1) {
        return NextResponse.json({ error: `This request is no longer pending (current status: ${approval.status}).` }, { status: 409 });
      }
      await writeAudit(approval.workspaceId, "approval.rejected", approval.id, { approvalId: approval.id }, userId);
      await updateExecution(approval, "CANCELLED", "REJECTED", { approvalId: approval.id });
      return NextResponse.json({ status: "REJECTED", message: "Approval rejected. No email was sent." });
    }

    try {
      validateEmailProviderConfig();
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Email provider is not configured." }, { status: 503 });
    }

    const email = parseEmailApprovalReason(approval.reason);
    if (!email || !isValidEmail(email.to) || !email.subject.trim() || !email.body.trim()) {
      return NextResponse.json({ error: "This approval does not contain a valid email draft." }, { status: 422 });
    }
    if (email.subject.length > 180 || email.body.length > 20000) {
      return NextResponse.json({ error: "The saved email draft exceeds allowed limits." }, { status: 422 });
    }

    if (approval.status !== "PENDING" && approval.status !== "SEND_FAILED") {
      return NextResponse.json({ error: `This request cannot be sent from status ${approval.status}.` }, { status: 409 });
    }

    const claimed = await prisma.approval.updateMany({
      where: { id, workspaceId, status: approval.status },
      data: { status: "SENDING" }
    });
    if (claimed.count !== 1) {
      return NextResponse.json({ error: "Another request is already processing this approval. Refresh and check its status." }, { status: 409 });
    }

    try {
      const delivery = await sendApprovedEmail({
        approvalId: approval.id,
        intendedTo: email.to,
        subject: email.subject,
        body: email.body
      });
      const updatedReason = JSON.stringify({ ...email, delivery });
      await prisma.approval.update({
        where: { id: approval.id },
        data: { status: "SENT", resolvedAt: new Date(), reason: updatedReason }
      });
      await writeAudit(approval.workspaceId, "approval.email_sent", approval.id, {
        approvalId: approval.id,
        provider: delivery.provider,
        providerMessageId: delivery.messageId,
        intendedTo: delivery.intendedTo,
        actualTo: delivery.to,
        testMode: delivery.testMode
      }, userId);
      await updateExecution(approval, "COMPLETED", "SENT", {
        approvalId: approval.id,
        provider: delivery.provider,
        providerMessageId: delivery.messageId,
        testMode: delivery.testMode
      });
      return NextResponse.json({
        status: "SENT",
        message: delivery.testMode
          ? `Test email accepted by Resend. It was routed to ${delivery.to}, not the intended recipient.`
          : "Email accepted by Resend for delivery.",
        delivery
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email delivery failed.";
      const updatedReason = JSON.stringify({
        ...email,
        delivery: { status: "failed", provider: "resend", testMode: isEmailTestMode(), error: message, attemptedAt: new Date().toISOString() }
      });
      await prisma.approval.update({
        where: { id: approval.id },
        data: { status: "SEND_FAILED", resolvedAt: null, reason: updatedReason }
      });
      await writeAudit(approval.workspaceId, "approval.email_send_failed", approval.id, {
        approvalId: approval.id,
        error: message,
        testMode: isEmailTestMode()
      }, userId);
      await updateExecution(approval, "FAILED", "SEND_FAILED", { approvalId: approval.id, error: message });
      return NextResponse.json({ error: message, status: "SEND_FAILED" }, { status: 502 });
    }
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "NO_WORKSPACE_ASSIGNED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}