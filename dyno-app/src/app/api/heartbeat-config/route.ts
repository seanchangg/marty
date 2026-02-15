import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";

/**
 * Heartbeat config proxy — manages server-side API key for autonomous mode.
 *
 * "start" action: stores the API key as ANTHROPIC_API_KEY in the gateway's
 *                 credential vault so the agent can be woken by webhooks.
 * "stop"  action: removes the server-side API key from the credential vault.
 * "status" action: checks if a server-side key exists.
 *
 * Uses the gateway's /api/credentials endpoint, forwarding the client JWT.
 */

const GATEWAY_HTTP_URL =
  (process.env.NEXT_PUBLIC_GATEWAY_URL ?? "ws://localhost:18789")
    .replace("ws://", "http://")
    .replace("wss://", "https://");

function gatewayHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  return headers;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = getAuthUserId(req) || body.userId;

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const { action, apiKey } = body;

  if (!action || !["start", "stop", "status"].includes(action)) {
    return NextResponse.json(
      { error: "action must be start, stop, or status" },
      { status: 400 }
    );
  }

  try {
    if (action === "start" && apiKey) {
      // Store the API key in the credential vault
      const res = await fetch(`${GATEWAY_HTTP_URL}/api/credentials`, {
        method: "POST",
        headers: gatewayHeaders(req),
        body: JSON.stringify({
          userId,
          name: "ANTHROPIC_API_KEY",
          value: apiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { error: data.error || "Failed to store API key" },
          { status: res.status }
        );
      }
      return NextResponse.json({ ok: true, action: "start" });
    }

    if (action === "stop") {
      // Remove the API key from the credential vault
      const res = await fetch(`${GATEWAY_HTTP_URL}/api/credentials`, {
        method: "DELETE",
        headers: gatewayHeaders(req),
        body: JSON.stringify({
          userId,
          name: "ANTHROPIC_API_KEY",
        }),
      });
      const data = await res.json();
      if (!res.ok && res.status !== 404) {
        return NextResponse.json(
          { error: data.error || "Failed to remove API key" },
          { status: res.status }
        );
      }
      return NextResponse.json({ ok: true, action: "stop" });
    }

    if (action === "status") {
      // Check if an API key exists
      const res = await fetch(
        `${GATEWAY_HTTP_URL}/api/credentials?userId=${encodeURIComponent(userId)}`,
        { headers: gatewayHeaders(req) }
      );
      const data = await res.json();
      const hasKey = Array.isArray(data.credentials) &&
        data.credentials.some((c: { name: string }) => c.name === "ANTHROPIC_API_KEY");
      return NextResponse.json({ ok: true, hasKey });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: `Gateway unreachable: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }
}
