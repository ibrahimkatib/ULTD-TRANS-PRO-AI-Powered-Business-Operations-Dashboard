import OpenAI from "openai";

let client: OpenAI | null = null;

export function getAIProvider() {
  return (process.env.AI_PROVIDER || "openai").trim().toLowerCase();
}

export function getAIClient() {
  const provider = getAIProvider();

  if (client) return client;

  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

    client = new OpenAI({
      apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
    });
    return client;
  }

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

    client = new OpenAI({ apiKey });
    return client;
  }

  throw new Error(`Unsupported AI_PROVIDER: ${process.env.AI_PROVIDER}`);
}

export function getModel() {
  const provider = getAIProvider();
  return process.env.AI_MODEL?.trim() || (provider === "gemini" ? "gemini-2.5-flash" : "gpt-5.5");
}
