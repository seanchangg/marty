import { supabase } from "@/lib/supabase/client";

export interface TokenUsageTotals {
  totalTokensIn: number;
  totalTokensOut: number;
  sessionCount: number;
}

/**
 * Atomically increment the current user's token usage via a Postgres RPC.
 * Creates the row on first call, increments on subsequent calls.
 */
export async function addTokenUsage(
  tokensIn: number,
  tokensOut: number
): Promise<void> {
  try {
    await supabase.rpc("increment_token_usage", {
      p_tokens_in: tokensIn,
      p_tokens_out: tokensOut,
    });
  } catch {
    // non-critical
  }
}

/**
 * Fetch the single token-usage row for a given user.
 */
export async function fetchTokenUsageTotals(
  userId: string
): Promise<TokenUsageTotals> {
  try {
    const { data, error } = await supabase
      .from("token_usage")
      .select("tokens_in, tokens_out, session_count")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) {
      return { totalTokensIn: 0, totalTokensOut: 0, sessionCount: 0 };
    }

    return {
      totalTokensIn: data.tokens_in,
      totalTokensOut: data.tokens_out,
      sessionCount: data.session_count,
    };
  } catch {
    return { totalTokensIn: 0, totalTokensOut: 0, sessionCount: 0 };
  }
}
