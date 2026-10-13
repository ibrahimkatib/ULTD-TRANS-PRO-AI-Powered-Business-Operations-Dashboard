import { getPrisma } from "@/lib/prisma";
import type { RegisteredTool } from "./types";

/**
 * Read-only business analysis tool for score-based customer segmentation
 * and follow-up attention signals. It only reads data from the current workspace.
 */
export const customerInsightsTool: RegisteredTool = {
  name: "customer_insights",
  description:
    "Analyze contacts in the current workspace using score thresholds and open follow-up activities. " +
    "Use this tool whenever a request asks to filter customers or contacts by score, compare segments, " +
    "identify who needs attention, or explain overdue/high-priority follow-ups. " +
    "For a score threshold, pass the numeric value to minScore; results have scores strictly greater than minScore. " +
    "Read-only; never changes records.",
  risk: "read-only",
  approvalRequired: false,
  parameters: {
    type: "object",
    properties: {
      minScore: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description: "Score threshold; the tool returns contacts with score strictly greater than this number. For 'above 85', pass 85."
      },
      type: {
        type: "string",
        enum: ["ANY", "LEAD", "CUSTOMER", "PARTNER", "EMPLOYEE", "CANDIDATE"],
        description: "Contact type filter. Use CUSTOMER when the user explicitly asks for customers; otherwise use ANY."
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 20,
        description: "Maximum number of contacts to return, usually 10."
      }
    },
    required: ["minScore", "type", "limit"],
    additionalProperties: false
  },
  async execute(rawArgs, context) {
    const args = rawArgs as { minScore?: number; type?: string; limit?: number };
    const minScore = Math.max(0, Math.min(100, Number(args.minScore) || 0));
    const limit = Math.max(1, Math.min(20, Number(args.limit) || 10));
    const type = args.type && args.type !== "ANY" ? args.type : undefined;
    const prisma = getPrisma();
    const now = new Date();
    const nearTerm = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const contacts = await prisma.contact.findMany({
      where: {
        workspaceId: context.workspaceId,
        score: { gt: minScore },
        ...(type ? { type: type as never } : {})
      },
      include: {
        company: true,
        activities: {
          where: { completedAt: null },
          orderBy: [{ dueAt: "asc" }]
        }
      },
      orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
      take: limit
    });

    const results = contacts.map((contact) => {
      const openActivities = contact.activities.map((activity) => {
        const dueAt = activity.dueAt;
        const overdue = !!dueAt && dueAt.getTime() < now.getTime();
        const priority = String(activity.priority);
        const highPrioritySoon =
          !!dueAt && dueAt.getTime() <= nearTerm.getTime() &&
          (priority === "HIGH" || priority === "URGENT");
        const needsAttention = overdue || highPrioritySoon;
        const reasons: string[] = [];
        if (overdue) reasons.push("Open activity is overdue");
        if (highPrioritySoon && !overdue) reasons.push(`${priority} priority activity due within 48 hours`);
        return {
          id: activity.id,
          title: activity.title,
          type: activity.type,
          priority: activity.priority,
          dueAt: dueAt ? dueAt.toISOString() : null,
          summary: activity.summary,
          overdue,
          needsAttention,
          reasons
        };
      });

      const attentionActivities = openActivities.filter((activity) => activity.needsAttention);
      return {
        id: contact.id,
        name: `${contact.firstName} ${contact.lastName}`.trim(),
        email: contact.email,
        title: contact.title,
        type: contact.type,
        status: contact.status,
        score: contact.score,
        company: contact.company?.name ?? null,
        needsAttention: attentionActivities.length > 0,
        attentionReasons: attentionActivities.flatMap((activity) => activity.reasons.map((reason) => `${activity.title}: ${reason}`)),
        openActivities
      };
    });

    return {
      workspaceScoped: true,
      filter: { scoreStrictlyGreaterThan: minScore, type: type ?? "ANY", limit },
      attentionRule: "Needs attention when an open activity is overdue, or when a HIGH/URGENT activity is due within the next 48 hours.",
      count: results.length,
      contacts: results
    };
  }
};
