"use client";

import { useTokenMetrics } from "@/hooks/useTokenMetrics";
import type { ChatMessage } from "@/types";
import type { TokenOverhead } from "@/hooks/useServerStatus";

interface TokenEstimatorProps {
  input: string;
  messages: ChatMessage[];
  maxHistoryMessages: number;
  includeSystemContext: boolean;
  overhead: TokenOverhead | null;
}

export default function TokenEstimator({
  input,
  messages,
  maxHistoryMessages,
  includeSystemContext,
  overhead,
}: TokenEstimatorProps) {
  const { estimatedTokens, estimatedCost, withToolsTokens, withToolsCost } = useTokenMetrics({
    input,
    messages,
    maxHistoryMessages,
    includeSystemContext,
    overhead,
  });

  if (!input && messages.length === 0) return null;

  return (
    <div className="flex gap-4 text-xs text-text/40">
      <span>
        Est. Input: {estimatedTokens.toLocaleString()}
        {withToolsTokens > estimatedTokens && (
          <span className="text-text/25"> / {withToolsTokens.toLocaleString()} w/ tools</span>
        )}
      </span>
      <span>
        Est. Cost: ${estimatedCost.toFixed(6)}
        {withToolsCost > estimatedCost && (
          <span className="text-text/25"> / ${withToolsCost.toFixed(6)}</span>
        )}
      </span>
    </div>
  );
}
