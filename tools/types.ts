export type ToolRisk = "read-only" | "side-effect" | "high-impact";

export type ToolContext = {
  workspaceId: string;
  executionId: string;
  actorId?: string;
};

export type RegisteredTool = {
  name: string;
  description: string;
  risk: ToolRisk;
  approvalRequired: boolean;
  parameters: Record<string, unknown>;
  execute: (args: unknown, context: ToolContext) => Promise<unknown>;
};
