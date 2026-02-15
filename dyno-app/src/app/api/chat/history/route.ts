import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { readChatHistory, writeChatHistory, clearChatHistory } from "@/lib/dyno-fs";

const MAX_STORED_MESSAGES = 200;

export async function GET(req: NextRequest) {
  const userId = getAuthUserId(req);

  if (userId) {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("chat_history")
      .select("messages")
      .eq("user_id", userId)
      .maybeSingle();

    return NextResponse.json({ messages: data?.messages ?? [] });
  }

  // Fallback: local file for unauthenticated/local mode
  const messages = await readChatHistory();
  return NextResponse.json({ messages });
}

export async function PUT(req: NextRequest) {
  const userId = getAuthUserId(req);
  const { messages, maxStoredMessages } = await req.json();

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
  }

  const limit = maxStoredMessages ?? MAX_STORED_MESSAGES;
  const trimmed = messages.slice(-limit);

  if (userId) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase
      .from("chat_history")
      .upsert(
        {
          user_id: userId,
          messages: trimmed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // Fallback: local file
  await writeChatHistory(trimmed);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = getAuthUserId(req);

  if (userId) {
    const supabase = createServerSupabaseClient();
    await supabase
      .from("chat_history")
      .upsert(
        {
          user_id: userId,
          messages: [],
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    return NextResponse.json({ ok: true });
  }

  // Fallback: local file
  await clearChatHistory();
  return NextResponse.json({ ok: true });
}
