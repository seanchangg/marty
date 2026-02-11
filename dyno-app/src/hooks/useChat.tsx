"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type { ChatMessage, ChatSettings, ThinkingStep } from "@/types";
import { DEFAULT_CHAT_SETTINGS } from "@/types";
import { addTokenUsage } from "@/lib/token-usage";

const WS_URL = "ws://localhost:8765";

export interface ChatProposal {
  id: string;
  tool: string;
  input: Record<string, unknown>;
  status: "pending" | "approved" | "denied";
}

interface ChatContextValue {
  messages: ChatMessage[];
  isLoading: boolean;
  proposals: ChatProposal[];
  sendMessage: (content: string, apiKey: string, userId?: string, memoryContext?: string) => void;
  clearMessages: () => void;
  approveProposal: (id: string) => void;
  denyProposal: (id: string) => void;
  /** Update settings without remounting the provider */
  updateSettings: (s: ChatSettings) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * Provider that owns all chat state + the WebSocket connection.
 * Mount once in the dashboard layout so it survives page navigation.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [proposals, setProposals] = useState<ChatProposal[]>([]);
  const [loaded, setLoaded] = useState(false);
  const settingsRef = useRef<ChatSettings>(DEFAULT_CHAT_SETTINGS);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const thinkingRef = useRef<ThinkingStep[]>([]);
  // Keep a ref to latest messages so the WS callback always reads fresh state
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const updateSettings = useCallback((s: ChatSettings) => {
    settingsRef.current = s;
  }, []);

  // Load history on mount (runs once for the lifetime of the dashboard)
  useEffect(() => {
    fetch("/api/chat/history")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  // Debounced save whenever messages change
  useEffect(() => {
    if (!loaded) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      fetch("/api/chat/history", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          maxStoredMessages: settingsRef.current.maxStoredMessages,
        }),
      }).catch(() => {});
    }, 500);
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [messages, loaded]);

  const approveProposal = useCallback((id: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "approved" as const } : p))
    );
    wsRef.current.send(JSON.stringify({ type: "approve", id }));
  }, []);

  const denyProposal = useCallback((id: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setProposals((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "denied" as const } : p))
    );
    wsRef.current.send(JSON.stringify({ type: "deny", id }));
  }, []);

  const sendMessage = useCallback(
    (content: string, apiKey: string, userId?: string, memoryContext?: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setProposals([]);
      thinkingRef.current = [];

      const settings = settingsRef.current;

      // Always send recent conversation history — Claude decides whether
      // to activate tools via the activate_tools gate tool.
      const history = [...messagesRef.current]
        .slice(-settings.maxHistoryMessages)
        .map((m) => ({ role: m.role, content: m.content }));

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: "chat",
            prompt: content,
            apiKey,
            history,
            includeSystemContext: settings.includeSystemContext,
            ...(userId ? { userId } : {}),
            ...(memoryContext ? { memoryContext } : {}),
          })
        );
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          // ── Build-style events (tools ON uses AgentCore) ──
          case "thinking":
            thinkingRef.current.push({
              type: "thought",
              content: data.text,
              timestamp: Date.now(),
            });
            break;

          case "tool_call":
            thinkingRef.current.push({
              type: "tool_call",
              content: `${data.tool}(${JSON.stringify(data.input)})`,
              timestamp: Date.now(),
            });
            break;

          case "tool_result":
            thinkingRef.current.push({
              type: "tool_result",
              content: data.result,
              timestamp: Date.now(),
            });
            break;

          case "proposal":
            setProposals((prev) => [
              ...prev,
              {
                id: data.id,
                tool: data.tool,
                input: data.input,
                status: "pending",
              },
            ]);
            break;

          case "execution_result":
            // Mark proposal as resolved
            setProposals((prev) =>
              prev.map((p) =>
                p.id === data.id
                  ? { ...p, status: data.status === "completed" ? "approved" as const : "denied" as const }
                  : p
              )
            );
            if (data.result) {
              thinkingRef.current.push({
                type: "tool_result",
                content: data.result || data.error || "",
                timestamp: Date.now(),
              });
            }
            break;

          case "token_usage":
            // Silently track — no UI needed in chat
            break;

          // ── Final response (both tools-on and tools-off) ──
          case "chat_response": {
            if (data.tokensIn || data.tokensOut) {
              addTokenUsage(data.tokensIn || 0, data.tokensOut || 0);
            }

            const thinking: ThinkingStep[] = [
              ...thinkingRef.current,
              {
                type: "tool_result",
                content: `Tokens in: ${data.tokensIn || 0} | Tokens out: ${data.tokensOut || 0}`,
                timestamp: Date.now(),
              },
            ];

            const assistantMessage: ChatMessage = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: data.response,
              thinking,
              timestamp: Date.now(),
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setIsLoading(false);
            setProposals([]);
            wsRef.current = null;
            thinkingRef.current = [];
            ws.close();
            break;
          }

          case "error":
            setMessages((prev) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant",
                content: data.message || "An error occurred.",
                timestamp: Date.now(),
              },
            ]);
            setIsLoading(false);
            setProposals([]);
            wsRef.current = null;
            thinkingRef.current = [];
            ws.close();
            break;
        }
      };

      ws.onerror = () => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Failed to connect to agent server. Is it running?",
            timestamp: Date.now(),
          },
        ]);
        setIsLoading(false);
        wsRef.current = null;
        thinkingRef.current = [];
      };
    },
    [] // no deps needed — reads from refs
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    fetch("/api/chat/history", { method: "DELETE" }).catch(() => {});
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        proposals,
        sendMessage,
        clearMessages,
        approveProposal,
        denyProposal,
        updateSettings,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

/**
 * Hook consumed by ChatWindow and any other component that needs chat state.
 * Must be rendered inside <ChatProvider>.
 */
interface UseChatOptions {
  chatSettings?: ChatSettings | null;
}

export function useChat(options?: UseChatOptions) {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a <ChatProvider>");
  }

  const settings = options?.chatSettings ?? DEFAULT_CHAT_SETTINGS;

  // Push latest settings into the provider so the WS uses them
  useEffect(() => {
    ctx.updateSettings(settings);
  }, [ctx, settings]);

  return {
    messages: ctx.messages,
    isLoading: ctx.isLoading,
    proposals: ctx.proposals,
    sendMessage: ctx.sendMessage,
    clearMessages: ctx.clearMessages,
    approveProposal: ctx.approveProposal,
    denyProposal: ctx.denyProposal,
  };
}
