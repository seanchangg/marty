"use client";

import { clsx } from "clsx";
import ThinkingTrace from "./ThinkingTrace";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={clsx("flex flex-col gap-1", isUser ? "items-end" : "items-start")}
    >
      {message.thinking && message.thinking.length > 0 && (
        <div className="w-full max-w-[80%]">
          <ThinkingTrace steps={message.thinking} />
        </div>
      )}
      <div
        className={clsx(
          "max-w-[80%] px-4 py-2.5 text-sm",
          isUser ? "bg-primary text-text" : "bg-surface text-text"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
      <span className="text-[10px] text-text/30 px-1">
        {new Date(message.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
}
