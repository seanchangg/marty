import { NextRequest, NextResponse } from "next/server";
import { readChatHistory, writeChatHistory, clearChatHistory } from "@/lib/dyno-fs";

export async function GET() {
  const messages = await readChatHistory();
  return NextResponse.json({ messages });
}

export async function PUT(req: NextRequest) {
  const { messages, maxStoredMessages } = await req.json();
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
  }
  await writeChatHistory(messages, maxStoredMessages);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await clearChatHistory();
  return NextResponse.json({ ok: true });
}
