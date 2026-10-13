import { NextResponse } from "next/server";
import { answerBusinessQuestion } from "@/lib/business-intelligence";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = String(body?.prompt ?? "").trim();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const result = await answerBusinessQuestion(prompt);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Copilot error", error);
    return NextResponse.json({ error: "Unable to analyze workspace data" }, { status: 500 });
  }
}
