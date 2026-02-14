/**
 * Widget-facing webhook data endpoint.
 *
 * GET /api/webhook-data?userId=...&endpointName=...&limit=20&since=ISO_TIMESTAMP
 *
 * Returns recent webhook payloads for a specific endpoint. Designed for
 * widgets using "direct" mode webhooks — no bot processing, no token spend.
 *
 * Unlike /api/webhooks?action=poll (agent-facing), this endpoint:
 *  - Is read-only (does NOT mark payloads as processed)
 *  - Returns both processed and unprocessed payloads
 *  - Supports incremental polling via `since` parameter
 *  - Is scoped to a single endpoint name (required)
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const endpointName = searchParams.get("endpointName");
  const limitParam = searchParams.get("limit");
  const since = searchParams.get("since");

  if (!userId || !endpointName) {
    return NextResponse.json(
      { error: "userId and endpointName are required" },
      { status: 400 }
    );
  }

  const limit = Math.min(
    Math.max(1, parseInt(limitParam || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    MAX_LIMIT
  );

  const supabase = createServerSupabaseClient();

  // Verify endpoint exists and is in direct mode
  const { data: endpoint, error: lookupError } = await supabase
    .from("webhook_endpoints")
    .select("mode, enabled")
    .eq("user_id", userId)
    .eq("endpoint_name", endpointName)
    .single();

  if (lookupError || !endpoint) {
    return NextResponse.json({ error: "Endpoint not found" }, { status: 404 });
  }

  if (!endpoint.enabled) {
    return NextResponse.json({ error: "Endpoint disabled" }, { status: 403 });
  }

  if (endpoint.mode !== "direct") {
    return NextResponse.json(
      { error: "Endpoint is not in direct mode. Only direct-mode endpoints can be read via this API." },
      { status: 403 }
    );
  }

  // Fetch recent payloads (both processed and unprocessed — widgets just want data)
  let query = supabase
    .from("webhook_queue")
    .select("id, endpoint_name, payload, headers, received_at")
    .eq("user_id", userId)
    .eq("endpoint_name", endpointName)
    .order("received_at", { ascending: false })
    .limit(limit + 1); // fetch one extra to determine has_more

  if (since) {
    query = query.gt("received_at", since);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const rows = data || [];
  const hasMore = rows.length > limit;
  const payloads = hasMore ? rows.slice(0, limit) : rows;

  return NextResponse.json({
    payloads,
    count: payloads.length,
    has_more: hasMore,
  });
}
