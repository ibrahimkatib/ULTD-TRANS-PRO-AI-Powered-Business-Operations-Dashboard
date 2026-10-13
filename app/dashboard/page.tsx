import Link from "next/link";
import {PageHeader,Panel,Stat,Badge,MiniKpi} from "@/components/Page";
import {getPrisma} from "@/lib/prisma";

export default async function Page(){
  let data={contacts:0,companies:0,pipeline:0,revenue:0,overdue:0,openDeals:0,paidInvoices:0,agents:0,activities:0,insights:[] as {title:string;message:string;severity:string}[]};
  let recent:{name:string;stage:string;value:number}[]=[];
  try{
    const prisma=getPrisma();
    const ws=await prisma.workspace.findFirst({orderBy:{createdAt:"asc"}});
    if(ws){
      const [contacts,companies,deals,invoices,agents,activities,insights]=await Promise.all([
        prisma.contact.count({where:{workspaceId:ws.id}}),
        prisma.company.count({where:{workspaceId:ws.id}}),
        prisma.deal.findMany({where:{workspaceId:ws.id,stage:{notIn:["WON","LOST"]}},orderBy:{value:"desc"},take:6}),
        prisma.invoice.findMany({where:{workspaceId:ws.id}}),
        prisma.agent.count({where:{workspaceId:ws.id,status:"ACTIVE"}}),
        prisma.activity.count({where:{workspaceId:ws.id,completedAt:null}}),
        prisma.insight.findMany({where:{workspaceId:ws.id,resolved:false},orderBy:{createdAt:"desc"},take:3}),
      ]);
      data.contacts=contacts;data.companies=companies;data.pipeline=deals.reduce((s,d)=>s+d.value*d.probability/100,0);data.openDeals=deals.length;data.agents=agents;data.activities=activities;data.revenue=invoices.filter(i=>i.status==="PAID").reduce((s,i)=>s+i.amount,0);data.paidInvoices=invoices.filter(i=>i.status==="PAID").length;data.overdue=invoices.filter(i=>i.status==="OVERDUE").reduce((s,i)=>s+i.amount,0);data.insights=insights;recent=deals.map(d=>({name:d.name,stage:d.stage,value:d.value}));
    }
  }catch{}
  if(!recent.length) recent=[{name:"Growth Automation Program",stage:"PROPOSAL",value:32000},{name:"Operations Intelligence",stage:"NEGOTIATION",value:18400},{name:"Reporting & Compliance Suite",stage:"QUALIFIED",value:12750}];
  return <>
    <div className="hero"><div className="kicker"><i/> AI-NATIVE BUSINESS OPERATING SYSTEM</div><h2>Turn business data into decisions, actions and measurable growth.</h2><p>ULTD TRANS PRO combines customer operations, finance, campaigns, analytics and AI agents in one command center. The goal is not another dashboard — it is a system that can observe, recommend, execute and learn from business workflows.</p><div className="hero-actions"><Link className="primary-button" href="/copilot">Open AI Copilot</Link><Link className="ghost-button" href="/workflows">Design automation</Link></div></div>
    <PageHeader eyebrow="COMMAND CENTER" title="Business overview" description="A live operational view for founders, operators and HR teams — customers, money, people, work and AI in one place." action={{label:"Create workflow",href:"/workflows"}} secondary={{label:"View reports",href:"/reports"}}/>
    <div className="stat-grid"><Stat label="Revenue collected" value={`€${data.revenue.toLocaleString()}`} detail={`${data.paidInvoices} paid invoices`} trend="+12.8% vs last period"/><Stat label="Weighted pipeline" value={`€${Math.round(data.pipeline).toLocaleString()}`} detail={`${data.openDeals} open opportunities`} trend="3 deals need attention"/><Stat label="Customers & contacts" value={`${data.contacts}`} detail={`${data.companies} companies`} trend="+8 new this month"/><Stat label="Open action queue" value={`${data.activities}`} detail={`${data.agents} active AI agents`} trend="AI can prioritize this"/></div>
    <div className="layout-2">
      <Panel title="Executive signals" description="High-value information surfaced from the operating layer."><div className="list">{(data.insights.length?data.insights:[{title:"Pipeline concentration detected",message:"One opportunity represents a large share of expected revenue.",severity:"HIGH"},{title:"Overdue invoice requires attention",message:"A customer payment is past due and should trigger a follow-up.",severity:"URGENT"},{title:"Campaign performance is improving",message:"Recent engagement suggests a stronger audience segment.",severity:"MEDIUM"}]).map((x,i)=><div className="insight" key={i}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><strong>{x.title}</strong><Badge tone={x.severity==="URGENT"?"red":x.severity==="HIGH"?"amber":"violet"}>{x.severity}</Badge></div><p>{x.message}</p><Link href="/insights" style={{fontSize:9,fontWeight:800,color:"#5260c9"}}>Review insight →</Link></div>)}</div></Panel>
      <Panel title="Action center" description="What deserves attention next."><div className="mini-grid"><MiniKpi label="Overdue invoices" value={`€${data.overdue.toLocaleString()}`} detail="Trigger follow-up"/><MiniKpi label="Top opportunity" value="€32K" detail="Proposal stage"/><MiniKpi label="Campaign ROI" value="4.2×" detail="Current quarter"/></div><div className="list" style={{marginTop:10}}><div className="list-item"><div><strong>Send invoice reminder</strong><small>AI draft ready · 1 approval</small></div><Badge tone="red">URGENT</Badge></div><div className="list-item"><div><strong>Follow up on proposal</strong><small>High-value opportunity · 2 days</small></div><Badge tone="amber">HIGH</Badge></div><div className="list-item"><div><strong>Review campaign audience</strong><small>Segment efficiency changed</small></div><Badge tone="blue">AI SUGGESTS</Badge></div></div></Panel>
    </div>
    <div className="layout-2">
      <Panel title="Revenue & pipeline trend" description="Illustrative operating trend from the current workspace."><div className="chart">{[{m:"May",v:42},{m:"Jun",v:58},{m:"Jul",v:51},{m:"Aug",v:68},{m:"Sep",v:75},{m:"Oct",v:88},{m:"Nov",v:96}].map(x=><div className="bar-col" key={x.m}><span className="bar-value">{x.v}k</span><div className="bar" style={{height:`${x.v}%`}}/><span className="bar-label">{x.m}</span></div>)}</div></Panel>
      <Panel title="Top open opportunities" description="Weighted by deal value and probability."><div className="list">{recent.map((d,i)=><div className="list-item" key={i}><div><strong>{d.name}</strong><small>{d.stage}</small></div><div style={{textAlign:"right"}}><strong>€{d.value.toLocaleString()}</strong><small>open opportunity</small></div></div>)}</div></Panel>
    </div>
    <Panel title="What the platform is built to connect" description="This is the layer you will later connect to automation, APIs and AI providers."><div className="cards"><div className="feature-card"><h3>Customer operations</h3><p>Contacts, companies, notes, follow-ups, opportunities and lifecycle history.</p><Link href="/customers">Open customer hub →</Link></div><div className="feature-card"><h3>Finance & reporting</h3><p>Invoices, revenue, overdue payments, KPIs and management reporting.</p><Link href="/reports">Open reporting →</Link></div><div className="feature-card"><h3>AI & automation</h3><p>Agents, tasks, approvals, execution logs and future external integrations.</p><Link href="/agents">Open AI control →</Link></div></div></Panel>
  </>;
}
