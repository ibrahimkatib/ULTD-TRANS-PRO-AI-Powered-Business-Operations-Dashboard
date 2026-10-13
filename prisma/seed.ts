import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const d = (days:number) => new Date(Date.now() + days * 86400000);

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: "platform-pro-demo" },
    update: { name: "Platform Pro Demo" },
    create: { name: "Platform Pro Demo", slug: "platform-pro-demo" },
  });
  const workspace = await prisma.workspace.upsert({
    where: { organizationId_slug: { organizationId: org.id, slug: "command-center" } },
    update: { name: "Command Center" },
    create: { organizationId: org.id, name: "Command Center", slug: "command-center" },
  });
  await prisma.user.upsert({
    where: { email: "owner@platformpro.demo" },
    update: { name: "Ibrahim Khatib", role: "OWNER", organizationId: org.id },
    create: { email: "owner@platformpro.demo", name: "Ibrahim Khatib", role: "OWNER", organizationId: org.id },
  });
  const operations = await prisma.agent.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: "business-operations" } },
    update: {},
    create: { workspaceId: workspace.id, name: "Business Operations Agent", slug: "business-operations", description: "Monitors customers, follow-ups, reports and operational signals.", model: "AI Provider (later)" },
  });
  await prisma.agent.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: "growth-intelligence" } },
    update: {},
    create: { workspaceId: workspace.id, name: "Growth Intelligence Agent", slug: "growth-intelligence", description: "Analyzes pipeline, campaigns and commercial opportunities.", model: "AI Provider (later)" },
  });
  await prisma.task.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: "daily-business-brief" } },
    update: { agentId: operations.id },
    create: { workspaceId: workspace.id, agentId: operations.id, name: "Daily Business Brief", slug: "daily-business-brief", description: "Summarize priorities, changes and recommended actions.", definitionMd: "# Daily Business Brief\nReview permitted business data, summarize changes, identify risks and propose next actions.", priority: "HIGH" },
  });
  await prisma.task.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: "follow-up-priority" } },
    update: { agentId: operations.id },
    create: { workspaceId: workspace.id, agentId: operations.id, name: "Follow-up Priority", slug: "follow-up-priority", description: "Find contacts and deals that need attention.", definitionMd: "# Follow-up Priority\nIdentify overdue or high-value follow-ups and rank them by urgency and expected business impact.", priority: "HIGH" },
  });

  const acme = await prisma.company.upsert({ where: { id: "demo-company-acme" }, update: {}, create: { id: "demo-company-acme", workspaceId: workspace.id, name: "Northstar Logistics", industry: "Logistics", ownerName: "Maya Chen", email: "ops@northstar.example", value: 18400 } });
  const orbit = await prisma.company.upsert({ where: { id: "demo-company-orbit" }, update: {}, create: { id: "demo-company-orbit", workspaceId: workspace.id, name: "Orbit Retail Group", industry: "Retail", ownerName: "David Cole", email: "growth@orbit.example", value: 32600 } });
  const nova = await prisma.company.upsert({ where: { id: "demo-company-nova" }, update: {}, create: { id: "demo-company-nova", workspaceId: workspace.id, name: "Nova Health Services", industry: "Healthcare", ownerName: "Sara Malik", email: "procurement@nova.example", value: 12750 } });

  const contactSeeds = [
    { id:"demo-contact-1", companyId:acme.id, firstName:"Maya", lastName:"Chen", email:"maya@northstar.example", title:"Operations Director", type:"CUSTOMER" as const, score:91 },
    { id:"demo-contact-2", companyId:orbit.id, firstName:"David", lastName:"Cole", email:"david@orbit.example", title:"Head of Growth", type:"LEAD" as const, score:84 },
    { id:"demo-contact-3", companyId:nova.id, firstName:"Sara", lastName:"Malik", email:"sara@nova.example", title:"Procurement Lead", type:"CUSTOMER" as const, score:88 },
    { id:"demo-contact-4", companyId:null, firstName:"Jon", lastName:"Reed", email:"jon@example.com", title:"Founder", type:"PARTNER" as const, score:72 },
  ];
  for (const c of contactSeeds) await prisma.contact.upsert({ where:{id:c.id}, update:c, create:{...c,workspaceId:workspace.id} });

  const deals = [
    { id:"demo-deal-1", companyId:orbit.id, contactId:"demo-contact-2", name:"Growth Automation Program", value:32000, stage:"PROPOSAL" as const, probability:65, expectedClose:d(21) },
    { id:"demo-deal-2", companyId:acme.id, contactId:"demo-contact-1", name:"Operations Intelligence", value:18400, stage:"NEGOTIATION" as const, probability:78, expectedClose:d(10) },
    { id:"demo-deal-3", companyId:nova.id, contactId:"demo-contact-3", name:"Reporting & Compliance Suite", value:12750, stage:"QUALIFIED" as const, probability:40, expectedClose:d(45) },
  ];
  for (const deal of deals) await prisma.deal.upsert({ where:{id:deal.id}, update:deal, create:{...deal,workspaceId:workspace.id} });

  const invoices = [
    {id:"demo-inv-1",number:"INV-2026-1042",companyId:acme.id,amount:8400,status:"PAID" as const,dueDate:d(-12),paidAt:d(-10)},
    {id:"demo-inv-2",number:"INV-2026-1043",companyId:orbit.id,amount:12600,status:"SENT" as const,dueDate:d(8)},
    {id:"demo-inv-3",number:"INV-2026-1044",companyId:nova.id,amount:4150,status:"OVERDUE" as const,dueDate:d(-5)},
    {id:"demo-inv-4",number:"INV-2026-1045",companyId:acme.id,amount:2950,status:"DRAFT" as const,dueDate:d(18)},
  ];
  for (const inv of invoices) await prisma.invoice.upsert({ where:{id:inv.id}, update:inv, create:{...inv,workspaceId:workspace.id,currency:"EUR"} });

  const activities = [
    {id:"demo-act-1",contactId:"demo-contact-2",type:"FOLLOW_UP" as const,title:"Follow up on growth proposal",summary:"High-value opportunity waiting for response.",ownerName:"Operations Team",priority:"HIGH" as const,dueAt:d(0)},
    {id:"demo-act-2",contactId:"demo-contact-1",type:"MEETING" as const,title:"Quarterly operations review",summary:"Review automation opportunities and current KPIs.",ownerName:"Maya Chen",priority:"MEDIUM" as const,dueAt:d(1)},
    {id:"demo-act-3",contactId:"demo-contact-3",type:"EMAIL" as const,title:"Send overdue invoice reminder",summary:"Invoice INV-2026-1044 is overdue.",ownerName:"Finance",priority:"URGENT" as const,dueAt:d(-1)},
  ];
  for (const a of activities) await prisma.activity.upsert({ where:{id:a.id}, update:a, create:{...a,workspaceId:workspace.id} });

  const campaigns = [
    {id:"demo-camp-1",name:"Q4 Operations Insight",channel:"Email",status:"RUNNING" as const,audience:"Operations leaders",sentCount:1240,openCount:486,clickCount:94,revenue:8200},
    {id:"demo-camp-2",name:"Founder Intelligence Brief",channel:"Email",status:"SCHEDULED" as const,audience:"Founders & CEOs",sentCount:0,openCount:0,clickCount:0,revenue:0,scheduledAt:d(2)},
  ];
  for (const c of campaigns) await prisma.campaign.upsert({ where:{id:c.id}, update:c, create:{...c,workspaceId:workspace.id} });

  const insights = [
    {id:"demo-ins-1",type:"OPPORTUNITY" as const,title:"Pipeline concentration detected",message:"Orbit Retail represents the largest open opportunity. A second stakeholder follow-up could materially improve close probability.",severity:"HIGH" as const,source:"Pipeline analysis"},
    {id:"demo-ins-2",type:"RISK" as const,title:"Overdue invoice requires attention",message:"INV-2026-1044 is overdue. Trigger a reminder and create a follow-up task.",severity:"URGENT" as const,source:"Finance"},
    {id:"demo-ins-3",type:"TREND" as const,title:"Campaign engagement is improving",message:"The latest campaign is converting opens into clicks above the workspace baseline.",severity:"MEDIUM" as const,source:"Campaign analytics"},
  ];
  for (const i of insights) await prisma.insight.upsert({ where:{id:i.id}, update:i, create:{...i,workspaceId:workspace.id} });

  console.log("ULTD TRANS PRO business core seed completed.");
}
main().finally(async()=>prisma.$disconnect());
