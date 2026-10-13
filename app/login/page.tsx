"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", background: "#f8fafc" }}>
      <div style={{ background: "white", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", textAlign: "center", width: "360px" }}>
        <h2 style={{ marginBottom: "10px", color: "#1e293b" }}>ULTD TRANS PRO</h2>
        <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>Sign in to access your secure workspace</p>
        
        <form onSubmit={async (e) => {
          e.preventDefault();
          const email = (document.getElementById("email") as HTMLInputElement).value;
          await signIn("credentials", { 
            email, 
            redirect: true, 
            callbackUrl: "/playground" 
          });
        }}>
          <input 
            id="email" 
            type="email" 
            defaultValue="admin@example.com" 
            required 
            style={{ width: "100%", padding: "10px", marginBottom: "15px", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }} 
          />
          <button 
            type="submit" 
            style={{ width: "100%", padding: "10px", background: "#4f46e5", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
          >
            Sign In as Admin
          </button>
        </form>
      </div>
    </div>
  );
}