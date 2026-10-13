import { PageHeader, Panel } from "@/components/Page";
import { AgentPlayground } from "@/components/ClientDemo";

export default function Page() {
  return <>
    <PageHeader eyebrow="OPERATE · LIVE RUNTIME" title="Agent Playground" description="Run the Business Operations Agent against authorized workspace data. The first live tool is customer_search; outbound actions stop at human approval." action={{ label: "View tools", href: "/tools" }} />
    <AgentPlayground />
    <Panel title="What changed in v0.6" description="The platform now has a real provider loop instead of a classification-only simulation.">
      <div className="cards">
        <div className="feature-card"><h3>Real AI runtime</h3><p>The server calls the configured AI provider through a provider boundary. Gemini can use the OpenAI-compatible Chat Completions interface, and the browser never receives the API key.</p></div>
        <div className="feature-card"><h3>Tool registry</h3><p>Models can only request registered functions. Every tool has a purpose, risk level and explicit execution boundary.</p></div>
        <div className="feature-card"><h3>Human approval</h3><p>Side-effect requests create an approval record and stop before anything is sent or changed.</p></div>
      </div>
    </Panel>
  </>;
}
