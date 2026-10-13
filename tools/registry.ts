import { workspaceSearchTool } from "./definitions/workspace-search";
import type { RegisteredTool } from "./types";

export const toolRegistry: Record<string, RegisteredTool> = {
  workspace_search: workspaceSearchTool,
};

export function getRegisteredTools(): RegisteredTool[] {
  return Object.values(toolRegistry);
}

export function getChatTools() {
  return Object.values(toolRegistry).map(tool => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters
    }
  }));
}