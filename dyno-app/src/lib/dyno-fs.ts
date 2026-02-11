import fs from "fs/promises";
import path from "path";
import os from "os";

const DEFAULT_CLAUDE_MD = `# Agent System Prompt

You are a helpful personal AI agent managed through Dyno.

## Instructions
- Be concise and helpful
- Use tools when appropriate
- Log your thinking process
`;

function getDynoHome(): string {
  const envHome = process.env.DYNO_HOME;
  if (envHome) {
    return envHome.replace(/^~/, os.homedir());
  }
  return path.join(os.homedir(), ".dyno");
}

export async function ensureDynoDir(): Promise<string> {
  const home = getDynoHome();
  await fs.mkdir(path.join(home, "context"), { recursive: true });
  await fs.mkdir(path.join(home, "tools"), { recursive: true });
  await fs.mkdir(path.join(home, "logs"), { recursive: true });
  await fs.mkdir(path.join(home, "screenshots"), { recursive: true });
  await fs.mkdir(path.join(home, "uploads"), { recursive: true });
  return home;
}

export { getDynoHome };

export async function initializeDefaultContext(userName?: string): Promise<void> {
  const home = await ensureDynoDir();
  const contextPath = path.join(home, "context", "claude.md");
  try {
    await fs.access(contextPath);
  } catch {
    let content = DEFAULT_CLAUDE_MD;
    if (userName) {
      content = content.replace(
        "# Agent System Prompt",
        `# Agent System Prompt\n\nUser: ${userName}`
      );
    }
    await fs.writeFile(contextPath, content, "utf-8");
  }
}

export async function readContextFile(filename: string): Promise<string> {
  const home = getDynoHome();
  const filePath = path.join(home, "context", filename);
  return fs.readFile(filePath, "utf-8");
}

export async function writeContextFile(
  filename: string,
  content: string
): Promise<void> {
  const home = await ensureDynoDir();
  const filePath = path.join(home, "context", filename);
  await fs.writeFile(filePath, content, "utf-8");
}

export async function listContextFiles(): Promise<string[]> {
  const home = getDynoHome();
  const contextDir = path.join(home, "context");
  try {
    return await fs.readdir(contextDir);
  } catch {
    return [];
  }
}

export async function appendTelemetry(entry: Record<string, unknown>): Promise<void> {
  const home = await ensureDynoDir();
  const logPath = path.join(home, "logs", "telemetry.json");
  let entries: Record<string, unknown>[] = [];
  try {
    const raw = await fs.readFile(logPath, "utf-8");
    entries = JSON.parse(raw);
  } catch {
    entries = [];
  }
  entries.push(entry);
  await fs.writeFile(logPath, JSON.stringify(entries, null, 2), "utf-8");
}

export async function readTelemetry(): Promise<Record<string, unknown>[]> {
  const home = getDynoHome();
  const logPath = path.join(home, "logs", "telemetry.json");
  try {
    const raw = await fs.readFile(logPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function writeToolFile(
  name: string,
  content: string
): Promise<void> {
  const home = await ensureDynoDir();
  const filePath = path.join(home, "tools", name);
  await fs.writeFile(filePath, content, "utf-8");
}

export async function listToolFiles(): Promise<string[]> {
  const home = getDynoHome();
  const toolsDir = path.join(home, "tools");
  try {
    return await fs.readdir(toolsDir);
  } catch {
    return [];
  }
}

export async function readToolFile(name: string): Promise<string> {
  const home = getDynoHome();
  const filePath = path.join(home, "tools", name);
  return fs.readFile(filePath, "utf-8");
}

const DEFAULT_MAX_STORED_MESSAGES = 200;

export async function readChatHistory(): Promise<Record<string, unknown>[]> {
  const home = getDynoHome();
  const historyPath = path.join(home, "logs", "chat-history.json");
  try {
    const raw = await fs.readFile(historyPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function writeChatHistory(
  messages: Record<string, unknown>[],
  maxStoredMessages?: number
): Promise<void> {
  const home = await ensureDynoDir();
  const historyPath = path.join(home, "logs", "chat-history.json");
  const limit = maxStoredMessages ?? DEFAULT_MAX_STORED_MESSAGES;
  const trimmed = messages.slice(-limit);
  await fs.writeFile(historyPath, JSON.stringify(trimmed, null, 2), "utf-8");
}

export async function clearChatHistory(): Promise<void> {
  const home = getDynoHome();
  const historyPath = path.join(home, "logs", "chat-history.json");
  await fs.writeFile(historyPath, "[]", "utf-8");
}
