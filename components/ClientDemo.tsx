"use client";
import { useState } from "react";

type ToolTrace = { name: string; status: string; arguments?: unknown; result?: unknown };
type Result = { status?: string; message?: string; error?: string; executionId?: string; model?: string; approvalRequired?: boolean; tools?: ToolTrace[] };

const examples = [
  "Find the customer named Maya Chen.",
  "Show me leads related to Orbit Retail Group.",
  "Find customer contacts and summarize who needs attention.",
  "Draft an email to david@orbit.example asking for an update on the Growth Automation Program."
];

export function AgentPlayground() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<Result>({ status: "idle", message: "No execution yet." });
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  return <div className="agent-lab">
    <section className="panel agent-request-panel">
      <div className="panel-head">
        <div>
          <h2>Agent request</h2>
          <p>Send a natural-language request to the real runtime. Read-only tools can execute; side effects stop at approval.</p>
        </div>
        <span className="badge badge-violet">TOOL-GROUNDED</span>
      </div>
      <textarea className="big-input" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g. Find the customer named Maya Chen and tell me her company and role."/>
      <div className="example-row">{examples.map(example => <button key={example} className="example-chip" onClick={() => setPrompt(example)}>{example}</button>)}</div>
      <button className="primary-button action" disabled={loading || !prompt.trim()} onClick={run}>{loading ? "Running agent…" : "Run Agent"}</button>
    </section>

    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Runtime result</h2>
          <p>Execution result, tool calls and approval state.</p>
        </div>
        {result.status && result.status !== "idle" && <span className={`badge ${result.status === "completed" ? "badge-green" : result.status === "waiting_approval" ? "badge-amber" : "badge-neutral"}`}>{result.status}</span>}
      </div>
      <div className="runtime-summary">
        <div><small>Execution</small><strong>{result.executionId ? result.executionId.slice(0, 12) + "…" : "—"}</strong></div>
        <div><small>Model</small><strong>{result.model || (result.status === "simulated" ? "simulation" : "—")}</strong></div>
        <div><small>Tools</small><strong>{result.tools?.length ?? 0}</strong></div>
      </div>
      {result.message && <div className="runtime-message">{result.message}</div>}
      {result.error && <div className="runtime-error">{result.error}</div>}
      {result.approvalRequired && <div className="approval-banner"><strong>Human approval required</strong><span>The agent did not send or change anything. Review the request in the Approval Queue.</span></div>}
      <div className="tool-trace">
        <div className="trace-title">Tool trace</div>
        {!result.tools?.length ? <div className="empty-trace">No tool calls in this execution.</div> : result.tools.map((tool, index) => <div className="trace-item" key={`${tool.name}-${index}`}>
          <div><strong>{tool.name}</strong><span>{tool.status}</span></div>
          <pre>{JSON.stringify(tool.result ?? tool.arguments ?? {}, null, 2)}</pre>
        </div>)}
      </div>
    </section>
  </div>;
}
