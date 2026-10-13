import { NextResponse } from "next/server";
import { readTask } from "@/lib/agent";

export async function GET(request: Request) {
  const task = new URL(request.url).searchParams.get("task") || "system-health-check";
  try {
    const result = await readTask(task);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to read task";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
