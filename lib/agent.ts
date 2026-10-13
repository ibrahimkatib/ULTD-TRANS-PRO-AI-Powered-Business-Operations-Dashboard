import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

export async function readTask(taskId: string) {
  if (!/^[a-z0-9-]+$/.test(taskId)) throw new Error("Invalid task id");
  const file = path.join(ROOT, "agent", "tasks", `${taskId}.md`);
  const content = await fs.readFile(file, "utf8");
  return { taskId, content };
}

export async function readSkill(skillId: string) {
  if (!/^[a-z0-9-]+$/.test(skillId)) throw new Error("Invalid skill id");
  const file = path.join(ROOT, "agent", "skills", skillId, "SKILL.md");
  const content = await fs.readFile(file, "utf8");
  return { skillId, content };
}
