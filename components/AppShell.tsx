import Link from "next/link";

const groups = [
  ["COMMAND CENTER", [["Overview","/dashboard"],["AI Copilot","/copilot"],["Insights","/insights"],["Reports","/reports"]]],
  ["CUSTOMER & GROWTH", [["Customers","/customers"],["Companies","/companies"],["Deals & Pipeline","/deals"],["Activities","/activities"],["Campaigns","/campaigns"]]],
  ["FINANCE", [["Invoices","/invoices"],["Revenue","/revenue"]]],
  ["AI & AUTOMATION", [["Agents","/agents"],["Automations","/workflows"],["Executions","/executions"],["Approvals","/approvals"]]],
  ["GOVERNANCE", [["People","/people"],["Audit Log","/audit"],["Knowledge","/references"],["Integrations","/integrations"]]],
] as const;

export function AppShell({children}:{children:React.ReactNode}) {
  return <div className="app-shell">
    <aside className="sidebar">
      <Link href="/dashboard" className="brand">
        <span className="brand-mark">UP</span><span><b>ULTD TRANS</b><small>PRO / BUSINESS OS</small></span>
      </Link>
      <div className="command-card"><div className="command-top"><span className="status-dot"/> CONTROL LAYER ONLINE</div><strong>Command Center</strong><span>Command, intelligence & automation</span></div>
      <div className="workspace-switcher"><small>ACTIVE WORKSPACE</small><strong>Platform Pro Demo</strong><span>Command Center · EUR</span></div>
      <nav>{groups.map(([title,items])=><section key={title}><div className="nav-label">{title}</div>{items.map(([label,href])=><Link className="nav-link" key={href} href={href}><span>{label}</span>{label==="AI Copilot"&&<em>NEW</em>}</Link>)}</section>)}</nav>
      <div className="sidebar-footer"><div className="mode-pill"><i/>Live-ready workspace · tool registry active</div><small>ULTD TRANS PRO v0.6</small></div>
    </aside>
    <div className="main-area">
      <header className="topbar"><div className="topbar-left"><span className="mobile-menu">☰</span><div><small>BUSINESS OPERATING SYSTEM</small><strong>Platform Command Center</strong></div></div><div className="top-actions"><span className="top-status">● Demo data · v0.6 runtime</span><Link className="ghost-button" href="/copilot">Ask Copilot</Link><div className="avatar">IK</div></div></header>
      <main className="page-wrap">{children}</main>
    </div>
  </div>
}
