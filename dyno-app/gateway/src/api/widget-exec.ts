/**
 * Widget execution API — lets widget iframes call saved backend scripts.
 *
 * POST /api/widget-exec
 * Body: { script, input, userId, timeout? }
 *
 * Validates the script name, delegates to the legacy bridge's `run_script`
 * tool with stdin_data, and returns the script's stdout/stderr/exit_code.
 */

import type { IncomingMessage, ServerResponse } from "http";
import type { LegacyToolBridge } from "../tools/dyno-legacy.js";

// ── Types ────────────────────────────────────────────────────────────────────

interface WidgetExecDeps {
  legacyBridge: LegacyToolBridge | null;
}

interface WidgetExecBody {
  script?: string;
  name?: string;
  scriptName?: string;
  script_name?: string;
  input?: unknown;
  userId?: string;
  timeout?: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_BODY_BYTES = 1_048_576; // 1 MB
const SCRIPT_NAME_RE = /^[a-zA-Z0-9._-]+$/;

// ── Route handler ────────────────────────────────────────────────────────────

export async function handleWidgetExecRequest(
  req: IncomingMessage,
  res: ServerResponse,
  deps: WidgetExecDeps,
): Promise<boolean> {
  const url = req.url || "";
  const method = req.method || "GET";

  if (!url.startsWith("/api/widget-exec")) return false;

  // CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    });
    res.end();
    return true;
  }

  if (method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return true;
  }

  // Read body with size limit
  let rawBody: string;
  try {
    rawBody = await readBody(req, MAX_BODY_BYTES);
  } catch {
    sendJson(res, 413, { error: "Payload too large (max 1 MB)" });
    return true;
  }

  let body: WidgetExecBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON" });
    return true;
  }

  // Validate required fields — accept any common naming for the script identifier
  const script = body.script || body.name || body.scriptName || body.script_name;
  const { input, userId, timeout } = body;

  if (!script || typeof script !== "string") {
    console.warn(`[widget-exec] 400: script name is required. Body keys: ${Object.keys(body as Record<string, unknown>).join(", ")}`);
    sendJson(res, 400, { error: "script name is required" });
    return true;
  }

  if (!SCRIPT_NAME_RE.test(script)) {
    console.warn(`[widget-exec] 400: Invalid script name: "${script}"`);
    sendJson(res, 400, {
      error: `Invalid script name "${script}" — only alphanumeric characters, dots, dashes, and underscores allowed`,
    });
    return true;
  }

  if (!deps.legacyBridge) {
    sendJson(res, 503, { error: "Backend execution not available" });
    return true;
  }

  // Build run_script arguments
  const toolInput: Record<string, unknown> = {
    name: script,
    timeout: typeof timeout === "number" ? Math.min(timeout, 120) : 30,
  };

  if (input !== undefined) {
    toolInput.stdin_data = JSON.stringify(input);
  }

  try {
    const resultStr = await deps.legacyBridge.executeTool(
      "run_script",
      toolInput,
      userId || undefined,
    );

    console.log(`[widget-exec] Raw result (first 500 chars): ${resultStr.slice(0, 500)}`);

    // The legacy bridge returns a JSON string — parse it so we return clean JSON
    let result: Record<string, unknown>;
    try {
      const parsed = JSON.parse(resultStr);
      // Handle MCP content array wrapper: { content: [{ type: "text", text: "..." }] }
      if (parsed.content && Array.isArray(parsed.content) && parsed.content[0]?.text) {
        result = JSON.parse(parsed.content[0].text);
      } else {
        result = parsed;
      }
    } catch {
      result = { stdout: resultStr, stderr: "", exit_code: 0, success: true };
    }

    // Ensure stdout is always present (even if empty) so widgets don't get undefined
    if (result.stdout === undefined) {
      result.stdout = "";
    }

    sendJson(res, 200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Script execution failed";
    sendJson(res, 500, { error: message, stdout: "", stderr: message, success: false });
  }

  return true;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        reject(new Error("Payload too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
  });
  res.end(body);
}
