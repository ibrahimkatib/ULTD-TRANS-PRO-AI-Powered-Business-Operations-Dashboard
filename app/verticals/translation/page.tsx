import {PageHeader,Panel} from "@/components/Page"; export default function Page(){return <><PageHeader eyebrow="VERTICAL PACK" title="Translation Operations" description="A domain extension for the existing ULTD TRANS translation business."/><div className="cards"><div className="feature-card"><h3>Request intake</h3><p>Language, word count, service type, deadline and specialization.</p></div><div className="feature-card"><h3>Matching</h3><p>Language pair, specialization, rating and availability.</p></div><div className="feature-card"><h3>Review</h3><p>Post-editing, quality checks and ratings.</p></div></div><Panel title="Assets"><div className="codebox">tasks/
skills/
references/
tools/
policies/</div></Panel></>}