import Link from "next/link"; import {PageHeader,Panel} from "@/components/Page"; export default function Page(){return <><PageHeader eyebrow="ORGANIZE" title="Vertical Packs" description="Install industry-specific capabilities without changing the generic Core."/><div className="cards"><div className="feature-card"><h3>Translation</h3><p>Languages, translators, quotes and review.</p><Link href="/verticals/translation">Inspect pack →</Link></div><div className="feature-card"><h3>Logistics</h3><p>Shipment, carrier and customs operations.</p><Link href="/verticals/logistics">Inspect pack →</Link></div><div className="feature-card"><h3>Custom</h3><p>Create another industry pack with the same contract.</p></div></div><Panel title="Pack contract"><div className="codebox">verticals/&lt;industry&gt;/
├── tasks/
├── skills/
├── references/
├── tools/
└── policies/</div></Panel></>}