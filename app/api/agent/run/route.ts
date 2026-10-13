import { NextResponse } from "next/server";
import { runAgent } from "@/lib/agent/runtime";
import { requirePrincipal } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    // 1. Authenticate the request and get the secure workspace ID
    const { workspaceId, userId } = await requirePrincipal();

    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt ?? "").trim();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    // 2. Pass the secure context to the agent
    const result = await runAgent(prompt, workspaceId, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Agent run error", error);
    if (error.message === "UNAUTHORIZED" || error.message === "NO_WORKSPACE_ASSIGNED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Agent execution failed" }, { status: 500 });
  }
}