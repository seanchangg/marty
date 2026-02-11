"use client";

import { useEffect, useRef } from "react";
import type { BuildEvent } from "@/types";

interface EventStreamProps {
  events: BuildEvent[];
}

function EventLabel({ type }: { type: string }) {
  const colors: Record<string, string> = {
    thinking: "text-text/60",
    tool_call: "text-secondary",
    tool_result: "text-secondary/70",
    proposal: "text-highlight",
    execution_result: "text-highlight/80",
    done: "text-highlight",
    error: "text-danger",
  };

  return (
    <span className={`text-xs font-medium ${colors[type] || "text-text/40"}`}>
      {type}
    </span>
  );
}

export default function EventStream({ events }: EventStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  if (events.length === 0) return null;

  return (
    <div className="bg-surface border border-primary/20 max-h-[400px] overflow-y-auto">
      <div className="px-4 py-2 border-b border-primary/20 sticky top-0 bg-surface z-10">
        <span className="text-xs font-semibold text-text/70">
          Event Stream
        </span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        {events.map((event, i) => (
          <div key={i} className="flex gap-3 text-sm">
            <div className="w-28 shrink-0 text-right">
              <EventLabel type={event.type} />
            </div>
            <div className="flex-1 min-w-0">
              {event.type === "thinking" && (
                <p className="text-text/70 whitespace-pre-wrap">
                  {event.text}
                </p>
              )}
              {event.type === "tool_call" && (
                <p className="text-secondary">
                  {event.tool}
                  {event.input?.filename && (
                    <span className="text-text/40 ml-1">
                      ({event.input.filename})
                    </span>
                  )}
                  {event.input?.package_name && (
                    <span className="text-text/40 ml-1">
                      ({event.input.package_name})
                    </span>
                  )}
                  {event.input?.url && (
                    <span className="text-text/40 ml-1">
                      ({event.input.url})
                    </span>
                  )}
                </p>
              )}
              {event.type === "tool_result" && (
                <div>
                  <pre className="text-text/50 whitespace-pre-wrap font-mono text-xs max-h-32 overflow-y-auto">
                    {event.result}
                  </pre>
                  {event.tool === "take_screenshot" && event.result && (() => {
                    const match = event.result.match(/Screenshot saved: (.+\.png)/);
                    if (!match) return null;
                    const filename = match[1];
                    return (
                      <a
                        href={`/api/screenshots/${filename}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2"
                      >
                        <img
                          src={`/api/screenshots/${filename}`}
                          alt={filename}
                          className="max-w-[400px] max-h-[250px] border border-primary/20 object-contain"
                        />
                      </a>
                    );
                  })()}
                </div>
              )}
              {event.type === "proposal" && (
                <p className="text-highlight">
                  Awaiting approval: {event.displayTitle}
                </p>
              )}
              {event.type === "execution_result" && (
                <p
                  className={
                    event.status === "completed"
                      ? "text-highlight/80"
                      : "text-danger"
                  }
                >
                  {event.status === "completed"
                    ? `Done: ${event.result?.slice(0, 100)}`
                    : `Denied: ${event.error || "User denied"}`}
                </p>
              )}
              {event.type === "done" && (
                <p className="text-highlight">
                  {event.summary}
                  {event.tokensIn !== undefined && (
                    <span className="text-text/40 ml-2">
                      ({event.tokensIn} in / {event.tokensOut} out)
                    </span>
                  )}
                </p>
              )}
              {event.type === "error" && (
                <p className="text-danger">{event.message}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
