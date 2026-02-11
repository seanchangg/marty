"use client";

import { useMemo } from "react";
import type { ChatMessage } from "@/types";
import type { TokenOverhead } from "@/hooks/useServerStatus";

const CHARS_PER_TOKEN = 4;
const COST_PER_INPUT_TOKEN = 3 / 1_000_000; // Sonnet: $3/M input
// Per-message JSON framing overhead: {"role":"user","content":"..."} ≈ 40 chars
const MESSAGE_FRAMING_CHARS = 40;
// activate_tools gate tool definition ≈ 200 chars
const GATE_TOOL_CHARS = 200;

interface TokenMetricsInput {
  input: string;
  messages: ChatMessage[];
  maxHistoryMessages: number;
  includeSystemContext: boolean;
  overhead: TokenOverhead | null;
}

export function useTokenMetrics({
  input,
  messages,
  maxHistoryMessages,
  includeSystemContext,
  overhead,
}: TokenMetricsInput) {
  return useMemo(() => {
    // Shared: conversation history + current input
    let conversationChars = 0;
    const historySlice = messages.slice(-maxHistoryMessages);
    for (const msg of historySlice) {
      conversationChars += msg.content.length + MESSAGE_FRAMING_CHARS;
    }
    if (input) {
      conversationChars += input.length + MESSAGE_FRAMING_CHARS;
    }

    // Phase 1 (lightweight): system prompt + gate tool + conversation
    let phase1Chars = conversationChars + GATE_TOOL_CHARS;
    if (includeSystemContext && overhead) {
      phase1Chars += overhead.systemChars;
    }

    // Phase 2 (if tools activate): system prompt with tool descriptions + full tool defs + conversation
    let phase2Chars = conversationChars;
    if (includeSystemContext && overhead) {
      phase2Chars += overhead.systemWithToolsChars + overhead.toolDefsChars;
    }

    const estimatedTokens = Math.ceil(phase1Chars / CHARS_PER_TOKEN);
    const estimatedCost = estimatedTokens * COST_PER_INPUT_TOKEN;
    const withToolsTokens = Math.ceil((phase1Chars + phase2Chars) / CHARS_PER_TOKEN);
    const withToolsCost = withToolsTokens * COST_PER_INPUT_TOKEN;

    return { estimatedTokens, estimatedCost, withToolsTokens, withToolsCost, totalChars: phase1Chars };
  }, [input, messages, maxHistoryMessages, includeSystemContext, overhead]);
}
