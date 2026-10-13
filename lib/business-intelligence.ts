import { getPrisma } from "@/lib/prisma";

import { requirePrincipal } from "@/lib/auth-utils";

export type BusinessSnapshot = {
  workspace: { id: string; name: string };
  customers: number;
  leads: number;
  companies: number;
  openDeals: number;
  pipelineValue: number;
  weightedPipeline: number;
  paidRevenue: number;
  overdueAmount: number;
  overdueInvoices: number;
  openActions: number;
  activeAgents: number;
  campaignSent: number;
  campaignOpenRate: number;
  campaignClickRate: number;
  topDeals: Array<{ name: string; value: number; stage: string; probability: number; expectedClose: string | null }>;
  overdueItems: Array<{ number: string; amount: number; company: string; dueDate: string }>;
  priorityActions: Array<{ title: string; priority: string; dueAt: string | null; summary: string | null }>;
  recentInsights: Array<{ title: string; type: string; severity: string; message: string }>;
};

export async function getBusinessSnapshot(): Promise<BusinessSnapshot> {
  const prisma = getPrisma();
  const { workspaceId } = await requirePrincipal();
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!workspace) throw new Error("No workspace configured");

  const [customers, leads, companies, deals, invoices, actions, activeAgents, campaigns, insights] = await Promise.all([
    prisma.contact.count({ where: { workspaceId: workspace.id, type: "CUSTOMER" } }),
    prisma.contact.count({ where: { workspaceId: workspace.id, type: "LEAD" } }),
    prisma.company.count({ where: { workspaceId: workspace.id, status: "ACTIVE" } }),
    prisma.deal.findMany({
      where: { workspaceId: workspace.id, stage: { notIn: ["WON", "LOST"] } },
      orderBy: [{ value: "desc" }, { probability: "desc" }],
      take: 8,
    }),
    prisma.invoice.findMany({
      where: { workspaceId: workspace.id },
      include: { company: true },
    }),
    prisma.activity.findMany({
      where: { workspaceId: workspace.id, completedAt: null },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 8,
    }),
    prisma.agent.count({ where: { workspaceId: workspace.id, status: "ACTIVE" } }),
    prisma.campaign.findMany({ where: { workspaceId: workspace.id } }),
    prisma.insight.findMany({
      where: { workspaceId: workspace.id, resolved: false },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  const paidRevenue = invoices.filter((x) => x.status === "PAID").reduce((sum, x) => sum + x.amount, 0);
  const overdue = invoices.filter((x) => x.status === "OVERDUE");
  const pipelineValue = deals.reduce((sum, x) => sum + x.value, 0);
  const weightedPipeline = deals.reduce((sum, x) => sum + x.value * (x.probability / 100), 0);
  const campaignSent = campaigns.reduce((sum, x) => sum + x.sentCount, 0);
  const campaignOpens = campaigns.reduce((sum, x) => sum + x.openCount, 0);
  const campaignClicks = campaigns.reduce((sum, x) => sum + x.clickCount, 0);

  return {
    workspace: { id: workspace.id, name: workspace.name },
    customers,
    leads,
    companies,
    openDeals: deals.length,
    pipelineValue,
    weightedPipeline,
    paidRevenue,
    overdueAmount: overdue.reduce((sum, x) => sum + x.amount, 0),
    overdueInvoices: overdue.length,
    openActions: actions.length,
    activeAgents,
    campaignSent,
    campaignOpenRate: campaignSent ? (campaignOpens / campaignSent) * 100 : 0,
    campaignClickRate: campaignSent ? (campaignClicks / campaignSent) * 100 : 0,
    topDeals: deals.map((x) => ({
      name: x.name,
      value: x.value,
      stage: x.stage,
      probability: x.probability,
      expectedClose: x.expectedClose?.toISOString() ?? null,
    })),
    overdueItems: overdue.map((x) => ({
      number: x.number,
      amount: x.amount,
      company: x.company?.name ?? "Unknown company",
      dueDate: x.dueDate.toISOString(),
    })),
    priorityActions: actions.map((x) => ({
      title: x.title,
      priority: x.priority,
      dueAt: x.dueAt?.toISOString() ?? null,
      summary: x.summary,
    })),
    recentInsights: insights.map((x) => ({
      title: x.title,
      type: x.type,
      severity: x.severity,
      message: x.message,
    })),
  };
}

function money(value: number) {
  return `€${Math.round(value).toLocaleString("en-US")}`;
}

export async function answerBusinessQuestion(prompt: string) {
  const text = prompt.trim();
  const lower = text.toLowerCase();
  const snapshot = await getBusinessSnapshot();

  if (/(attention|today|priority|urgent|focus|need.*attention)/i.test(lower)) {
    const actions = snapshot.priorityActions.slice(0, 4);
    const invoices = snapshot.overdueItems.slice(0, 3);
    return {
      mode: "data-grounded",
      title: "Today's attention queue",
      answer: [
        `There are ${snapshot.openActions} open actions and ${snapshot.overdueInvoices} overdue invoice(s).`,
        actions.length ? `Top action: ${actions[0].title}.` : "No open action was found.",
        invoices.length ? `Highest visible overdue invoice: ${invoices[0].number} for ${money(invoices[0].amount)} at ${invoices[0].company}.` : "No overdue invoice requires attention.",
      ].join(" "),
      data: { actions, invoices },
    };
  }

  if (/(deal|pipeline|close|opportunit)/i.test(lower)) {
    const deals = snapshot.topDeals.slice(0, 5);
    const lead = deals[0];
    return {
      mode: "data-grounded",
      title: "Pipeline analysis",
      answer: `Open pipeline is ${money(snapshot.pipelineValue)} with a weighted value of ${money(snapshot.weightedPipeline)} across ${snapshot.openDeals} opportunities.${lead ? ` The largest visible opportunity is ${lead.name} at ${money(lead.value)} with ${lead.probability}% probability.` : ""}`,
      data: { deals },
    };
  }

  if (/(invoice|payment|overdue|cash|receivable)/i.test(lower)) {
    return {
      mode: "data-grounded",
      title: "Finance snapshot",
      answer: `Collected revenue is ${money(snapshot.paidRevenue)}. There are ${snapshot.overdueInvoices} overdue invoice(s) worth ${money(snapshot.overdueAmount)} in total.`,
      data: { overdueItems: snapshot.overdueItems },
    };
  }

  if (/(campaign|marketing|email|engagement|open rate|click)/i.test(lower)) {
    return {
      mode: "data-grounded",
      title: "Campaign performance",
      answer: `Current campaign totals show ${snapshot.campaignSent.toLocaleString("en-US")} messages sent, a ${snapshot.campaignOpenRate.toFixed(1)}% open rate and a ${snapshot.campaignClickRate.toFixed(1)}% click rate.`,
      data: { sent: snapshot.campaignSent, openRate: snapshot.campaignOpenRate, clickRate: snapshot.campaignClickRate },
    };
  }

  if (/(customer|client|contact|lead)/i.test(lower)) {
    return {
      mode: "data-grounded",
      title: "Customer and growth snapshot",
      answer: `The workspace currently has ${snapshot.customers} customers, ${snapshot.leads} leads and ${snapshot.companies} active companies.`,
      data: { customers: snapshot.customers, leads: snapshot.leads, companies: snapshot.companies },
    };
  }

  if (/(automate|automation|automations|what should i automate)/i.test(lower)) {
    const recommendations = [];
    if (snapshot.overdueInvoices > 0) recommendations.push("Automate overdue invoice reminders with an approval step.");
    if (snapshot.openActions > 0) recommendations.push("Automate follow-up prioritization and create tasks for high-value opportunities.");
    if (snapshot.campaignSent > 0) recommendations.push("Automate campaign performance summaries and alert on engagement drops.");
    if (!recommendations.length) recommendations.push("Connect CRM, finance and communication tools first, then automate recurring reporting and follow-ups.");
    return {
      mode: "data-grounded",
      title: "Automation opportunities",
      answer: recommendations.join(" "),
      data: { recommendations },
    };
  }

  return {
    mode: "data-grounded",
    title: "Business snapshot",
    answer: `The workspace has ${snapshot.companies} companies, ${snapshot.customers} customers, ${snapshot.openDeals} open opportunities, ${money(snapshot.paidRevenue)} in paid revenue and ${snapshot.activeAgents} active AI agents. Ask about pipeline, invoices, campaigns, customers, priorities or automation opportunities for a deeper answer.`,
    data: snapshot,
  };
}
