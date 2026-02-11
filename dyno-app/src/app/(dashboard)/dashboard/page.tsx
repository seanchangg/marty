"use client";

import { useEffect, useState, useCallback } from "react";
import ChatWindow from "@/components/chat/ChatWindow";
import MemoryTable from "@/components/chat/MemoryTable";
import Card from "@/components/ui/Card";
import { useAgentStatus } from "@/hooks/useAgentStatus";
import { useAuth } from "@/hooks/useAuth";
import { useMemories } from "@/hooks/useMemories";
import {
  fetchTokenUsageTotals,
  type TokenUsageTotals,
} from "@/lib/token-usage";

const REFRESH_INTERVAL = 5000;

export default function DashboardPage() {
  const { status } = useAgentStatus();
  const { user } = useAuth();
  const { memories, saveMemory, deleteMemory, refresh: refreshMemories } = useMemories(user?.id);
  const [selectedMemoryIds, setSelectedMemoryIds] = useState<Set<string>>(new Set());
  const [totals, setTotals] = useState<TokenUsageTotals>({
    totalTokensIn: 0,
    totalTokensOut: 0,
    sessionCount: 0,
  });

  const refresh = useCallback(async () => {
    if (!user) return;
    const t = await fetchTokenUsageTotals(user.id);
    setTotals(t);
  }, [user]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  // Refresh memories periodically
  useEffect(() => {
    refreshMemories();
    const id = setInterval(refreshMemories, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refreshMemories]);

  const toggleMemory = (id: string) => {
    setSelectedMemoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Left column: chat (60%) + memory table (40%) stacked */}
      <div className="flex-[2] min-w-0 flex flex-col gap-4">
        <div className="flex-[3] min-h-0">
          <ChatWindow
            memories={memories}
            selectedMemoryIds={selectedMemoryIds}
          />
        </div>
        <div className="flex-[2] min-h-0">
          <MemoryTable
            memories={memories}
            selectedIds={selectedMemoryIds}
            onToggle={toggleMemory}
            onDelete={(id) => {
              deleteMemory(id);
              setSelectedMemoryIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
            }}
            onSave={saveMemory}
          />
        </div>
      </div>

      {/* Right column: stat cards */}
      <div className="flex-1 flex flex-col gap-4">
        <Card>
          <h3 className="text-xs font-medium text-text/50 mb-1">
            Agent Status
          </h3>
          <p className="text-lg font-semibold text-highlight capitalize">
            {status}
          </p>
        </Card>

        <Card>
          <h3 className="text-xs font-medium text-text/50 mb-1">Sessions</h3>
          <p className="text-lg font-semibold text-highlight">
            {totals.sessionCount}
          </p>
        </Card>

        <Card>
          <h3 className="text-xs font-medium text-text/50 mb-1">
            Tokens In / Out
          </h3>
          <p className="text-lg font-semibold text-highlight">
            {totals.totalTokensIn.toLocaleString()} /{" "}
            {totals.totalTokensOut.toLocaleString()}
          </p>
        </Card>

        <Card>
          <h3 className="text-xs font-medium text-text/50 mb-1">
            Est. Total Cost
          </h3>
          <p className="text-lg font-semibold text-highlight">
            $
            {(
              totals.totalTokensIn * 0.000003 +
              totals.totalTokensOut * 0.000015
            ).toFixed(6)}
          </p>
        </Card>
      </div>
    </div>
  );
}
