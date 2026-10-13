import { getPrisma } from "@/lib/prisma";
import type { RegisteredTool } from "./types";

export const requestSendEmailApprovalTool: RegisteredTool = {
  name: "request_send_email_approval",
  description: "Prepare an outbound email request. This never sends an email directly; it creates a human approval request first.",
  risk: "side-effect",
  approvalRequired: true,
  parameters: {
    type: "object",
    properties: {
      to: { type: "string", description: "Recipient email address." },
      subject: { type: "string", description: "Email subject." },
      body: { type: "string", description: "Email body." },
      reason: { type: "string", description: "Why the agent recommends this email." }
    },
    required: ["to", "subject", "body", "reason"],
    additionalProperties: false
  },
  async execute(rawArgs, context) {
    const args = rawArgs as { to: string; subject: string; body: string; reason: string };
    const prisma = getPrisma();
    const approval = await prisma.approval.create({
      data: {
        workspaceId: context.workspaceId,
        executionId: context.executionId,
        status: "PENDING",
        reason: JSON.stringify({
          tool: "send_email",
          risk: "side-effect",
          to: args.to,
          subject: args.subject,
          body: args.body,
          reason: args.reason
        })
      }
    });
    return {
      status: "waiting_approval",
      approvalId: approval.id,
      message: "Email request was blocked from execution and placed in the human approval queue."
    };
  }
};
