/**
 * Credential vault proxy — forwards to the Gateway credentials API.
 * Passes the client's Authorization header through so the gateway
 * can verify the Supabase JWT directly.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";

const GATEWAY_HTTP_URL = process.env.NEXT_PUBLIC_GATEWAY_URL
  ? process.env.NEXT_PUBLIC_GATEWAY_URL.replace("ws://", "http://").replace("wss://", "https://")
  : "http://localhost:18789";

function gatewayHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // Forward the original Authorization header so the gateway can verify the JWT
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;
  return headers;
}

export async function GET(req: NextRequest) {
  try {
    const userId = getAuthUserId(req) || "";
    const gatewayRes = await fetch(
      `${GATEWAY_HTTP_URL}/api/credentials?userId=${encodeURIComponent(userId)}`,
      { headers: gatewayHeaders(req) },
    );
    const data = await gatewayRes.json();
    return NextResponse.json(data, { status: gatewayRes.status });
  } catch {
    return NextResponse.json({ error: "Gateway not available" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gatewayRes = await fetch(`${GATEWAY_HTTP_URL}/api/credentials`, {
      method: "POST",
      headers: gatewayHeaders(req),
      body: JSON.stringify(body),
    });
    const data = await gatewayRes.json();
    return NextResponse.json(data, { status: gatewayRes.status });
  } catch {
    return NextResponse.json({ error: "Gateway not available" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const gatewayRes = await fetch(`${GATEWAY_HTTP_URL}/api/credentials`, {
      method: "DELETE",
      headers: gatewayHeaders(req),
      body: JSON.stringify(body),
    });
    const data = await gatewayRes.json();
    return NextResponse.json(data, { status: gatewayRes.status });
  } catch {
    return NextResponse.json({ error: "Gateway not available" }, { status: 503 });
  }
}
