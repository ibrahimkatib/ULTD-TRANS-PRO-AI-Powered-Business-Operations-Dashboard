import { PageHeader, Panel, Badge } from "@/components/Page";
import { ApprovalActions } from "@/components/ApprovalActions";
import { parseEmailApprovalReason } from "@/lib/email/approval-payload";
import { getPrisma } from "@/lib/prisma";

function toneFor(status: string): "neutral" | "green" | "amber" | "red" | "blue" {
  if (status === "SENT" || status === "APPROVED") return "green";
  if (status === "PENDING" || status === "SENDING") return "amber";
  if (status === "REJECTED" || status === "SEND_FAILED" || status === "EXPIRED" || status === "FAILED") return "red";
  return "neutral";
}

export default async function Page() {
  const prisma = getPrisma();
  const approvals = await prisma.approval.findMany({
    orderBy: { requestedAt: "desc" },
    take: 30,
    include: { workspace: true }
  });
  const testMode = (process.env.EMAIL_TEST_MODE ?? "true").trim().toLowerCase() !== "false";
  const emailConfigured = (process.env.EMAIL_PROVIDER ?? "").trim().toLowerCase() === "resend"
    && Boolean(process.env.EMAIL_API_KEY?.trim())
    && (testMode || Boolean(process.env.EMAIL_FROM?.trim()));

  return <>
    <PageHeader eyebrow="OPERATE" title="Approval Queue" description="Human review before an agent triggers a side effect." />
    <Panel
      title="Email approval workflow"
      description={testMode
        ? "SAFE TEST MODE is active. Approved emails are routed to Resend's test recipient, never to the intended recipient."
        : "LIVE EMAIL MODE is active. Approving a request will submit the email to its intended recipient."}
    >
      <div className="approval-mode-note">
        <strong>{testMode ? "SAFE TEST MODE" : "LIVE EMAIL MODE"}</strong>
        <span>{testMode
          ? "Target on provider: delivered@resend.dev. Resend uses this address to simulate email events; it does not deliver to the original contact."
          : "Messages may be delivered externally after approval. Confirm the sender domain and recipient before approving."}</span>
      </div>
      {!emailConfigured && <p className="approval-warning">Email provider is not configured. Add EMAIL_PROVIDER="resend" and EMAIL_API_KEY to .env. Keep EMAIL_TEST_MODE="true" for the first test.</p>}
      <div className="approval-list">
        {approvals.map((approval) => {
          const email = parseEmailApprovalReason(approval.reason);
          const delivery = email?.delivery;
          return <article className="approval-card" key={approval.id}>
            <div className="approval-card-header">
              <div>
                <div className="approval-card-title">{email ? email.subject : "Approval request"}</div>
                <div className="approval-card-subtitle">{approval.workspace.name} · Requested {approval.requestedAt.toLocaleString()}</div>
              </div>
              <Badge tone={toneFor(approval.status)}>{delivery?.status === "failed" && approval.status === "SEND_FAILED" ? "SEND FAILED" : approval.status.replaceAll("_", " ")}</Badge>
            </div>
            {email ? <>
              <div className="approval-detail-grid">
                <div><span>Intended recipient</span><strong>{email.to}</strong></div>
                <div><span>Risk</span><strong>External email</strong></div>
              </div>
              {email.reason && <p className="approval-reason">Reason: {email.reason}</p>}
              <details className="approval-draft">
                <summary>Review email draft</summary>
                <pre>{email.body}</pre>
              </details>
              {delivery?.status === "sent" && <p className="approval-success">Provider accepted the email. Message ID: {delivery.messageId || "recorded"}. {delivery.testMode ? `Test recipient: ${delivery.to}.` : `Recipient: ${delivery.to}.`}</p>}
              {delivery?.status === "failed" && <p className="approval-error">Last send failed: {delivery.error || "Unknown provider error"}</p>}
            </> : <details className="approval-draft"><summary>Review request details</summary><pre>{approval.reason}</pre></details>}
            <div className="approval-action-row">
              <ApprovalActions approvalId={approval.id} status={approval.status} testMode={testMode} emailConfigured={emailConfigured} />
            </div>
          </article>;
        })}
        {!approvals.length && <p className="muted">No approval requests yet. Ask the agent to draft an email to create one.</p>}
      </div>
    </Panel>
  </>;
}
