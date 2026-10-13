import { getPrisma } from "@/lib/prisma";
import { getAIClient, getAIProvider, getModel } from "@/providers/ai/client";
import { getChatTools, toolRegistry } from "@/tools/registry";
import type { ToolContext } from "@/tools/types";

const SYSTEM_INSTRUCTIONS = `
You are the ULTD TRANS PRO Business Operations Agent.

Mission:
- Help the user understand and operate business data inside the authorized workspace.
- For general lookups, searching across entities, or when the user asks about invoices, customers, or logs, use the workspace_search tool.
- Never invent data, amounts, statuses, or actions.
- Read-only tools may execute immediately.
- Any side-effect action must go through the human approval gate.
- Prefer concise, useful answers with evidence from tool results.
`.trim();

type ToolTrace = { name: string; status: string; arguments?: unknown; result?: unknown };

async function audit(workspaceId: string, action: string, executionId: string, metadataJson?: unknown, userId?: string) {
  const prisma = getPrisma();
  await prisma.auditEvent.create({
    // Record the actual user who initiated the action for accountability
    data: { workspaceId, action, actorType: userId ? "USER" : "AGENT", actorId: userId || executionId, metadataJson: metadataJson as never }
  });
}

function simulationResult(prompt: string) {
  const lower = prompt.toLowerCase();
  if (lower.includes("customer") || lower.includes("client") || lower.includes("contact")) {
    return "Simulation mode: I would use customer_search to retrieve authorized contacts from the workspace, then summarize the matching records.";
  }
  if (lower.includes("email") || lower.includes("send")) {
    return "Simulation mode: an outbound email would require the approval gate before any send operation.";
  }
  return "Simulation mode: the agent runtime is connected, but AGENT_MODE is not set to live yet.";
}

export async function runAgent(prompt: string, workspaceId: string, userId: string) {
  const prisma = getPrisma();
  const mode = (process.env.AGENT_MODE || "simulation").toLowerCase();
  const provider = getAIProvider();
  const hasKey = provider === "gemini" ? !!process.env.GEMINI_API_KEY : !!process.env.OPENAI_API_KEY;

  const execution = await prisma.execution.create({
    data: {
      workspaceId: workspaceId,
      status: mode === "live" && hasKey ? "RUNNING" : "COMPLETED",
      inputJson: { prompt, mode, provider }
    }
  });

  if (mode !== "live" || !hasKey) {
    const message = simulationResult(prompt);
    await prisma.execution.update({
      where: { id: execution.id },
      data: { outputJson: { mode: "simulation", message }, finishedAt: new Date() }
    });
    await audit(workspaceId, "agent.simulation", execution.id, { prompt, provider }, userId);
    return { status: "simulated", message, executionId: execution.id, tools: [] as ToolTrace[] };
  }

  const client = getAIClient();
  const tools = getChatTools();
  const traces: ToolTrace[] = [];
  const messages: Array<Record<string, unknown>> = [
    { role: "system", content: SYSTEM_INSTRUCTIONS },
    { role: "user", content: prompt }
  ];

  try {
    await audit(workspaceId, "agent.started", execution.id, { model: getModel(), provider, prompt }, userId);

    for (let round = 0; round < 5; round += 1) {
      const response = await client.chat.completions.create({
        model: getModel(),
        messages: messages as never,
        tools,
        tool_choice: "auto"
      });

      const message = response.choices[0]?.message;
      if (!message) throw new Error("AI provider returned no message");

      messages.push(message as never);
      const functionCalls = message.tool_calls ?? [];

      if (!functionCalls.length) {
        const finalMessage = message.content || "The agent completed without a text response.";
        await prisma.execution.update({
          where: { id: execution.id },
          data: { status: "COMPLETED", outputJson: { message: finalMessage, tools: traces } as any, finishedAt: new Date() }
        });
        await audit(workspaceId, "agent.completed", execution.id, { toolCount: traces.length, provider }, userId);
        return { status: "completed", message: finalMessage, executionId: execution.id, tools: traces, model: getModel(), provider };
      }

      let waitingApproval = false;

      for (const call of functionCalls) {
        if (call.type !== "function") continue;

        const tool = toolRegistry[call.function.name];
        if (!tool) {
          traces.push({ name: call.function.name, status: "blocked: unregistered tool", arguments: call.function.arguments });
          messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify({ error: "Tool is not registered" }) });
          continue;
        }

        let args: unknown;
        try {
          args = JSON.parse(call.function.arguments);
        } catch {
          args = { raw: call.function.arguments };
        }

        const context: ToolContext = { workspaceId: workspaceId, executionId: execution.id };
        const result = await tool.execute(args, context);

        if (tool.approvalRequired) {
          traces.push({ name: tool.name, status: "waiting approval", arguments: args, result });
          await audit(workspaceId, "tool.approval_requested", execution.id, { tool: tool.name, arguments: args, result }, userId);
          waitingApproval = true;
          continue;
        }

        traces.push({ name: tool.name, status: "executed", arguments: args, result });
        await audit(workspaceId, "tool.executed", execution.id, { tool: tool.name, arguments: args }, userId);
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result)
        });
      }

      if (waitingApproval) {
        await prisma.execution.update({
          where: { id: execution.id },
          data: { status: "WAITING_APPROVAL", outputJson: { tools: traces } as any, finishedAt: new Date() }
        });
        return {
          status: "waiting_approval",
          message: "The agent reached an action that requires human approval. Nothing was sent or changed outside the approval queue.",
          executionId: execution.id,
          tools: traces,
          approvalRequired: true,
          provider
        };
      }
    }

    throw new Error("Agent stopped after the maximum tool rounds");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent execution failed";
    await prisma.execution.update({
      where: { id: execution.id },
      data: { status: "FAILED", errorMessage: message, outputJson: { tools: traces } as any, finishedAt: new Date() }
    });
    await audit(workspaceId, "agent.failed", execution.id, { error: message, provider }, userId);
    throw error;
  }
}