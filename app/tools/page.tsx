import { PageHeader, Panel, Badge } from "@/components/Page";
import { getRegisteredTools } from "@/tools/registry";

export default function Page() {
  const tools = getRegisteredTools();
  return <>
    <PageHeader eyebrow="CONFIGURE" title="Tools Registry" description="The exact capabilities exposed to the agent. Read-only tools execute directly; side effects are gated by approval." />
    <Panel title="Registered tools" description={`${tools.length} explicit capabilities are currently available to the runtime.`}>
      <table className="table"><thead><tr><th>Tool</th><th>Purpose</th><th>Risk</th><th>Approval</th></tr></thead><tbody>
        {tools.map((tool) => <tr key={tool.name}><td><b>{tool.name}</b></td><td>{tool.description}</td><td><Badge tone={tool.risk === "read-only" ? "green" : "amber"}>{tool.risk}</Badge></td><td><Badge tone={tool.approvalRequired ? "amber" : "green"}>{tool.approvalRequired ? "Required" : "Not required"}</Badge></td></tr>)}
      </tbody></table>
    </Panel>
    <Panel title="Tool governance" description="This boundary is more important than the model itself.">
      <div className="detail-grid"><div className="detail"><strong>Least privilege</strong><span>The model receives only the functions registered by the platform runtime.</span></div><div className="detail"><strong>Workspace scope</strong><span>Customer search always filters by the current workspace before returning records.</span></div><div className="detail"><strong>Human control</strong><span>Side-effect tools create approvals instead of executing immediately.</span></div><div className="detail"><strong>Audit trail</strong><span>Agent starts, tool calls, approvals and completion are written to the audit log.</span></div></div>
    </Panel>
  </>;
}
