"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { AgentStatus } from "@/types";
import { HEALTH_URL } from "@/lib/agent-config";

const POLL_INTERVAL = 5000;

interface AgentStatusContextValue {
  status: AgentStatus;
  setStatus: (status: AgentStatus) => void;
}

const AgentStatusContext = createContext<AgentStatusContextValue>({
  status: "offline",
  setStatus: () => {},
});

export function useAgentStatus() {
  return useContext(AgentStatusContext);
}

export default function AgentStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatusState] = useState<AgentStatus>("offline");
  const manualOverrideRef = useRef<AgentStatus | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual override: lets the gateway WS or useBuildSession push status
  // immediately without waiting for the next health poll.
  // Setting "working" holds the override; setting "online"/"offline" clears it
  // so the health poll can take over again.
  const setStatus = useCallback((s: AgentStatus) => {
    manualOverrideRef.current = s === "working" ? s : null;
    setStatusState(s);
  }, []);

  // Poll the gateway health endpoint to reconcile status.
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(HEALTH_URL, {
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) throw new Error("not ok");
        if (cancelled) return;

        // Don't clobber the WebSocket-driven "working" status —
        // the WS session manager sets/clears it with better timing.
        if (manualOverrideRef.current === null) {
          setStatusState("online");
        }
      } catch {
        if (cancelled) return;
        manualOverrideRef.current = null;
        setStatusState("offline");
      }
    }

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <AgentStatusContext.Provider value={{ status, setStatus }}>
      {children}
    </AgentStatusContext.Provider>
  );
}
