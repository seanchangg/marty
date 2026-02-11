import { NextResponse } from "next/server";
import { readTelemetry } from "@/lib/dyno-fs";

export async function GET() {
  const entries = await readTelemetry();
  return NextResponse.json({ entries });
}
