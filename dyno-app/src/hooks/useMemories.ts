"use client";

import { useState, useEffect, useCallback } from "react";

export interface Memory {
  id: string;
  tag: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useMemories(userId: string | undefined) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/memories?userId=${userId}`);
      const data = await res.json();
      setMemories(data.memories ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveMemory = useCallback(
    async (tag: string, content: string) => {
      if (!userId) return;
      await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tag, content }),
      });
      refresh();
    },
    [userId, refresh]
  );

  const deleteMemory = useCallback(
    async (id: string) => {
      if (!userId) return;
      await fetch(`/api/memories?userId=${userId}&id=${id}`, {
        method: "DELETE",
      });
      refresh();
    },
    [userId, refresh]
  );

  return { memories, loading, refresh, saveMemory, deleteMemory };
}
