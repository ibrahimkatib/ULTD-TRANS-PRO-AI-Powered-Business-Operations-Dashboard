import { isValidEmail } from "@/lib/email/approval-payload";

export type SendApprovedEmailInput = {
  approvalId: string;
  intendedTo: string;
  subject: string;
  body: string;
};

export type SendApprovedEmailResult = {
  status: "sent";
  provider: "resend";
  messageId: string;
  to: string;
  intendedTo: string;
  testMode: boolean;
  sentAt: string;
};

export function isEmailTestMode() {
  // Safe by default: unless explicitly disabled, route approved messages to Resend's test recipient.
  return (process.env.EMAIL_TEST_MODE ?? "true").trim().toLowerCase() !== "false";
}

export function validateEmailProviderConfig() {
  const provider = (process.env.EMAIL_PROVIDER ?? "").trim().toLowerCase();
  if (provider !== "resend") {
    throw new Error('Email provider is not configured. Set EMAIL_PROVIDER="resend".');
  }
  if (!process.env.EMAIL_API_KEY?.trim()) {
    throw new Error("EMAIL_API_KEY is missing. Add your Resend API key to .env.");
  }
  if (!isEmailTestMode() && !process.env.EMAIL_FROM?.trim()) {
    throw new Error("EMAIL_FROM is required when EMAIL_TEST_MODE is false.");
  }
}

export async function sendApprovedEmail(input: SendApprovedEmailInput): Promise<SendApprovedEmailResult> {
  validateEmailProviderConfig();
  if (!isValidEmail(input.intendedTo)) throw new Error("The intended recipient email address is invalid.");
  if (!input.subject.trim() || input.subject.length > 180) throw new Error("The email subject is empty or too long.");
  if (!input.body.trim() || input.body.length > 20000) throw new Error("The email body is empty or exceeds 20,000 characters.");

  const testMode = isEmailTestMode();
  const intendedTo = input.intendedTo.trim();
  // The test recipient is deliberately fixed. Test mode never sends to the real intended recipient.
  const to = testMode ? "delivered@resend.dev" : intendedTo;
  const from = process.env.EMAIL_FROM?.trim() || (testMode ? "onboarding@resend.dev" : "");
  const subject = testMode ? `[ULTD TRANS PRO TEST] ${input.subject}` : input.subject;
  const text = testMode
    ? [
        "ULTD TRANS PRO — SAFE TEST MODE",
        "This test message was not sent to the originally intended recipient.",
        `Original intended recipient: ${intendedTo}`,
        "",
        "--- Approved draft ---",
        input.body
      ].join("\n")
    : input.body;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_API_KEY!.trim()}`,
      "Content-Type": "application/json",
      // Stable idempotency key protects against repeated clicks/retries for this approval.
      "Idempotency-Key": `ultd-trans-pro-approval-${input.approvalId}`
    },
    body: JSON.stringify({ from, to: [to], subject, text })
  });

  const responseBody = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    const message = typeof responseBody.message === "string"
      ? responseBody.message
      : typeof responseBody.name === "string"
        ? responseBody.name
        : `Email provider returned HTTP ${response.status}`;
    throw new Error(`Resend rejected the email request: ${message}`);
  }
  if (typeof responseBody.id !== "string" || !responseBody.id) {
    throw new Error("Resend accepted the request but did not return an email ID.");
  }

  return {
    status: "sent",
    provider: "resend",
    messageId: responseBody.id,
    to,
    intendedTo,
    testMode,
    sentAt: new Date().toISOString()
  };
}
