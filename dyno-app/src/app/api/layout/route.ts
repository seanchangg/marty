import { NextResponse } from "next/server";
import { readLayout, writeLayout } from "@/lib/dyno-fs";

export async function GET() {
  try {
    const raw = await readLayout();
    return NextResponse.json(raw ?? {});
  } catch {
    return NextResponse.json({});
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    await writeLayout(body);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
