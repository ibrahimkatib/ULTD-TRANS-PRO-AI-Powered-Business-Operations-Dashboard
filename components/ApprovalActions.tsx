"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ApprovalActions({
  approvalId,
  status,
  testMode,
  emailConfigured
}: {
  approvalId: string;
  status: string;
  testMode: boolean;
  emailConfigured: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function act(action: "approve" | "reject") {
    if (busy) return;
    const confirmation = action === "approve"
      ? testMode
        ? "Approve this request and send a TEST message to Resend's test recipient delivered@resend.dev? The original recipient will not receive it."
        : "Approve and send this email to the intended recipient?"
      : "Reject this request? No email will be sent.";
    if (!window.confirm(confirmation)) return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/approvals/${encodeURIComponent(approvalId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const result = await response.json().catch(() => ({})) as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
      setMessage(result.message || (action === "approve" ? "Approval processed." : "Request rejected."));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not process this request.");
    } finally {
      setBusy(false);
    }
  }

  if (status !== "PENDING" && status !== "SEND_FAILED") {
    return <div className="approval-feedback">{status === "SENT" ? "Email provider accepted this request." : status === "SENDING" ? "Sending is in progress. Refresh shortly." : status === "REJECTED" ? "Rejected — no email was sent." : status === "APPROVED" ? "Approved." : status}</div>;
  }

  return <div className="approval-action-area">
    {status === "PENDING" && <button className="primary-button" type="button" disabled={busy || !emailConfigured} onClick={() => act("approve")}>
      {busy ? "Processing…" : testMode ? "Approve & send test" : "Approve & send email"}
    </button>}
    {status === "SEND_FAILED" && <button className="primary-button" type="button" disabled={busy || !emailConfigured} onClick={() => act("approve")}>
      {busy ? "Retrying…" : "Retry email send"}
    </button>}
    {status === "PENDING" && <button className="ghost-button" type="button" disabled={busy} onClick={() => act("reject")}>Reject</button>}
    {!emailConfigured && <p className="approval-warning">Configure EMAIL_PROVIDER, EMAIL_API_KEY, and (outside test mode) EMAIL_FROM in .env before approving.</p>}
    {error && <p className="approval-error" role="alert">{error}</p>}
    {message && <p className="approval-success" role="status">{message}</p>}
  </div>;
}
