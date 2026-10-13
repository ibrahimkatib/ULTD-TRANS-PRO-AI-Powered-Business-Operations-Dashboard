export type EmailApprovalPayload = {
  tool: "send_email";
  risk?: string;
  to: string;
  subject: string;
  body: string;
  reason?: string;
  delivery?: {
    status?: string;
    provider?: string;
    messageId?: string;
    to?: string;
    intendedTo?: string;
    testMode?: boolean;
    sentAt?: string;
    error?: string;
    attemptedAt?: string;
  };
  [key: string]: unknown;
};

export function parseEmailApprovalReason(reason: string): EmailApprovalPayload | null {
  try {
    const value: unknown = JSON.parse(reason);
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const parsed = value as Record<string, unknown>;
    if (
      parsed.tool !== "send_email" ||
      typeof parsed.to !== "string" ||
      typeof parsed.subject !== "string" ||
      typeof parsed.body !== "string"
    ) return null;
    return parsed as EmailApprovalPayload;
  } catch {
    return null;
  }
}

export function isValidEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
