import {PageHeader,Panel,Badge} from "@/components/Page"; export default function Page(){return <><PageHeader eyebrow="CONFIGURE" title="Integrations & Providers" description="AI, email, storage and business APIs live behind provider adapters."/><Panel title="Provider matrix"><table className="table"><thead><tr><th>Provider</th><th>Category</th><th>Mode</th><th>Status</th></tr></thead><tbody>{[["Demo Agent","AI","Simulation","Connected"],["OpenAI","AI","API","Not configured"],["Email provider","Email","API","Not configured"],["Object storage","Storage","API","Not configured"],["CRM","Business","API","Not configured"]].map(r=><tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td><Badge>{r[3]}</Badge></td></tr>)}</tbody></table></Panel><Panel title="Configuration surface"><div className="codebox">AI_PROVIDER
OPENAI_API_KEY
DATABASE_URL
DIRECT_URL
AGENT_MODE
DEFAULT_WORKSPACE_ID</div></Panel></>}