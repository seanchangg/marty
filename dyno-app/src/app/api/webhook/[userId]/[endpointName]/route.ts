/**
 * Public webhook ingestion endpoint.
 *
 * POST /api/webhook/{userId}/{endpointName}
 *
 * Security layers:
 *  1. HMAC-SHA256 signature verification (shared secret)
 *  2. Replay protection via X-Webhook-Timestamp (5-minute window)
 *  3. Per-user rate limiting (configurable, default 100/hour)
 *  4. Payload size limit (1 MB)
 *  5. Internal auth secret when notifying Gateway
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createHmac, timingSafeEqual } from "crypto";

const GATEWAY_HTTP_URL = process.env.NEXT_PUBLIC_GATEWAY_URL
  ? process.env.NEXT_PUBLIC_GATEWAY_URL.replace("ws://", "http://").replace("wss://", "https://")
  : "http://localhost:18789";

const WEBHOOK_INTERNAL_SECRET =
  process.env.WEBHOOK_INTERNAL_SECRET ||
  process.env.GATEWAY_KEY_STORE_SECRET ||
  "dyno-dev-secret-change-in-production";

const MAX_PAYLOAD_BYTES = 1_048_576; // 1 MB
const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_RATE_LIMIT = 100; // per hour

/**
 * Verify the HMAC-SHA256 signature from the X-Webhook-Signature header.
 * Signature format: sha256=<hex digest>
 *
 * When X-Webhook-Timestamp is present, the signed payload is:
 *   timestamp + "." + body
 * This binds the timestamp to the signature, preventing replay attacks.
 */
function verifySignature(
  secret: string,
  body: string,
  signatureHeader: string,
  timestamp?: string
): boolean {
  const signedPayload = timestamp ? `${timestamp}.${body}` : body;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
  const provided = signatureHeader.replace(/^sha256=/, "");

  if (expected.length !== provided.length) return false;

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; endpointName: string }> }
) {
  const { userId, endpointName } = await params;

  if (!userId || !endpointName) {
    return NextResponse.json({ error: "Missing userId or endpointName" }, { status: 400 });
  }

  // ── Payload size limit ───────────────────────────────────────────────────
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
    if (rawBody.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
  } catch {
    return NextResponse.json({ error: "Failed to read body" }, { status: 400 });
  }

  // ── Replay protection ────────────────────────────────────────────────────
  const timestamp = req.headers.get("x-webhook-timestamp");
  if (timestamp) {
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() - ts) > REPLAY_WINDOW_MS) {
      return NextResponse.json(
        { error: "Timestamp expired or invalid. Include X-Webhook-Timestamp as unix ms." },
        { status: 401 }
      );
    }
  }

  const supabase = createServerSupabaseClient();

  // ── Endpoint lookup ──────────────────────────────────────────────────────
  const { data: endpoint, error: lookupError } = await supabase
    .from("webhook_endpoints")
    .select("secret, enabled")
    .eq("user_id", userId)
    .eq("endpoint_name", endpointName)
    .single();

  if (lookupError || !endpoint) {
    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }

  if (!endpoint.enabled) {
    return NextResponse.json({ error: "Endpoint disabled" }, { status: 403 });
  }

  // ── HMAC signature verification ──────────────────────────────────────────
  const signature = req.headers.get("x-webhook-signature") || "";
  if (!signature || !verifySignature(endpoint.secret, rawBody, signature, timestamp || undefined)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── Rate limiting ────────────────────────────────────────────────────────
  // Count webhooks received in the last hour for this user
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count: recentCount } = await supabase
    .from("webhook_queue")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("received_at", oneHourAgo);

  // Fetch user's configured rate limit (or use default)
  const { data: config } = await supabase
    .from("webhook_config")
    .select("rate_limit_per_hour")
    .eq("user_id", userId)
    .single();

  const rateLimit = config?.rate_limit_per_hour ?? DEFAULT_RATE_LIMIT;

  if ((recentCount ?? 0) >= rateLimit) {
    return NextResponse.json(
      { error: "Rate limit exceeded", limit: rateLimit, window: "1 hour" },
      { status: 429 }
    );
  }

  // ── Parse and store payload ──────────────────────────────────────────────
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    payload = { raw: rawBody };
  }

  const storedHeaders: Record<string, string> = {};
  for (const key of ["content-type", "user-agent", "x-github-event", "x-github-delivery"]) {
    const val = req.headers.get(key);
    if (val) storedHeaders[key] = val;
  }

  const { error: insertError } = await supabase
    .from("webhook_queue")
    .insert({
      user_id: userId,
      endpoint_name: endpointName,
      payload,
      headers: storedHeaders,
    });

  if (insertError) {
    console.error("[webhook] Queue insert error:", insertError.message);
    return NextResponse.json({ error: "Failed to queue webhook" }, { status: 500 });
  }

  // ── Notify Gateway (with internal auth) ──────────────────────────────────
  try {
    fetch(`${GATEWAY_HTTP_URL}/internal/webhook-notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WEBHOOK_INTERNAL_SECRET}`,
      },
      body: JSON.stringify({ userId, endpointName }),
    }).catch((err) => {
      console.warn("[webhook] Gateway notify failed:", err);
    });
  } catch {
    // Non-critical — webhook is already queued
  }

  return NextResponse.json({ ok: true, message: "Webhook received" }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}
