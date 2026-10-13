"use client";
import {useEffect, useState} from "react";
import Link from "next/link";

type Msg={role:"ai"|"user";text:string;meta?:string};

const suggestions=[
  "What needs my attention today?",
  "Which deals are most likely to close?",
  "Show me overdue invoices",
  "How are our campaigns performing?",
  "What should I automate next?",
];

export default function Copilot(){
  const [messages,setMessages]=useState<Msg[]>([]);
  const [text,setText]=useState("");
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    setMessages([{role:"ai",text:"I’m your Platform Copilot. I’m currently connected to the workspace data layer, so my answers are grounded in real companies, contacts, deals, invoices, campaigns and actions. An external LLM provider will be added after this data/tool layer is stable.",meta:"Data-grounded mode"}]);
  },[]);

  const send=async()=>{
    const q=text.trim(); if(!q||loading)return;
    setText(""); setMessages(m=>[...m,{role:"user",text:q}]); setLoading(true);
    try{
      const r=await fetch("/api/copilot",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:q})});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||"Request failed");
      setMessages(m=>[...m,{role:"ai",text:data.answer,meta:`${data.title} · ${data.mode}`}]);
    }catch(e){
      setMessages(m=>[...m,{role:"ai",text:e instanceof Error?e.message:"Unable to analyze workspace data",meta:"Error"}]);
    }finally{setLoading(false);}
  };

  return <>
    <div className="page-header"><div><div className="eyebrow">AI COMMAND LAYER</div><h1>AI Copilot</h1><p>Ask operational questions and get answers grounded in the current workspace. The next step is to connect an LLM to the same tool and data layer.</p></div><div className="header-actions"><span className="top-status">● DATA CONNECTED</span><Link className="ghost-button" href="/agents">Manage agents</Link><Link className="primary-button" href="/workflows">Build automation</Link></div></div>
    <div className="chat-shell">
      <aside className="chat-side"><h3>Suggested analysis</h3>{suggestions.map(x=><button key={x} className="chat-suggest" onClick={()=>setText(x)} style={{width:"100%",textAlign:"left",cursor:"pointer"}}><strong>{x}</strong><span>Reads permitted workspace data</span></button>)}<div className="panel" style={{padding:12,marginTop:12,marginBottom:0,background:"#fafcff"}}><strong style={{fontSize:10}}>Current layer</strong><p style={{fontSize:9,lineHeight:1.6,marginTop:5}}>Database → Business Intelligence → Copilot API → response. LLM/provider integration comes next.</p></div></aside>
      <section className="chat-main"><div className="chat-head"><strong>Platform Copilot</strong><span>Live workspace data · deterministic insights</span></div><div className="messages">{messages.map((m,i)=><div key={i} className={`message ${m.role}`}><div>{m.text}</div>{m.meta&&<small style={{display:"block",marginTop:7,opacity:.65,fontSize:8}}>{m.meta}</small>}</div>)}{loading&&<div className="message ai">Analyzing workspace data…</div>}</div><div className="chat-input"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about your business…"/><button className="primary-button action" onClick={send} disabled={loading}>{loading?"Thinking…":"Send"}</button></div></section>
    </div>
  </>;
}
