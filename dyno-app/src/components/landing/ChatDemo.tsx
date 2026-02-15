"use client";

import { useEffect, useState, useRef } from "react";

// Each step in the scripted demo
type Step =
  | { type: "user"; text: string }
  | { type: "thinking"; steps: { label: string; content: string }[] }
  | { type: "assistant"; text: string };

const SCRIPT: Step[] = [
  {
    type: "user",
    text: "Hey Marty, what's on my schedule today?",
  },
  {
    type: "thinking",
    steps: [
      { label: "Thinking", content: "User wants their schedule. I should check their calendar integration." },
      { label: "Tool Call", content: 'calendar.getEvents({ date: "today" })' },
      { label: "Tool Result", content: '[\n  { "time": "10:00", "title": "Team Standup" },\n  { "time": "14:00", "title": "Design Review" },\n  { "time": "17:00", "title": "Deploy Window" }\n]' },
    ],
  },
  {
    type: "assistant",
    text: "You have 3 things today:\n\n- **10:00** — Team Standup\n- **14:00** — Design Review\n- **17:00** — Deploy Window\n\nWant me to draft a message about the deploy?",
  },
  {
    type: "user",
    text: "Yeah, draft a Slack message for the team about the deploy.",
  },
  {
    type: "thinking",
    steps: [
      { label: "Thinking", content: "User wants a Slack message about the deploy window at 5pm. I'll draft something concise." },
      { label: "Tool Call", content: 'drafts.create({\n  channel: "#engineering",\n  content: "Deploy at 5pm today..."\n})' },
      { label: "Tool Result", content: '{ "id": "draft_8f3a", "status": "saved" }' },
    ],
  },
  {
    type: "assistant",
    text: "Done — I've drafted this for #engineering:\n\n> Deploy window opens at 5pm today. All PRs should be merged by 4:30. I'll run the pre-deploy checks at 4:45.\n\nWant me to send it, or make changes first?",
  },
];

const CHAR_SPEED = 18;
const PAUSE_BETWEEN = 700;
const THINKING_STEP_DELAY = 600;
const THINKING_CHAR_SPEED = 12;

export default function ChatDemo() {
  const [elements, setElements] = useState<React.ReactNode[]>([]);
  const [liveElement, setLiveElement] = useState<React.ReactNode | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasRun = useRef(false);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [elements, liveElement]);

  // Run animation on mount
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    let cancelled = false;

    async function run() {
      // Small initial delay so the section can fade in first
      await delay(800);

      for (const step of SCRIPT) {
        if (cancelled) return;

        if (step.type === "user") {
          for (let c = 0; c <= step.text.length; c++) {
            if (cancelled) return;
            setLiveElement(
              <MessageBubble role="user" text={step.text.slice(0, c)} typing />
            );
            await delay(CHAR_SPEED);
          }
          setElements((prev) => [...prev, <MessageBubble key={prev.length} role="user" text={step.text} />]);
          setLiveElement(null);
          await delay(PAUSE_BETWEEN);
        }

        if (step.type === "thinking") {
          const builtSteps: { label: string; content: string }[] = [];
          for (const ts of step.steps) {
            if (cancelled) return;
            for (let c = 0; c <= ts.content.length; c++) {
              if (cancelled) return;
              const partial = [...builtSteps, { label: ts.label, content: ts.content.slice(0, c) }];
              setLiveElement(<ThinkingTrace steps={partial} />);
              await delay(THINKING_CHAR_SPEED);
            }
            builtSteps.push(ts);
            setLiveElement(<ThinkingTrace steps={[...builtSteps]} />);
            await delay(THINKING_STEP_DELAY);
          }
          setElements((prev) => [...prev, <ThinkingTrace key={prev.length} steps={builtSteps} />]);
          setLiveElement(null);
        }

        if (step.type === "assistant") {
          for (let c = 0; c <= step.text.length; c++) {
            if (cancelled) return;
            setLiveElement(
              <MessageBubble role="assistant" text={step.text.slice(0, c)} typing />
            );
            await delay(CHAR_SPEED);
          }
          setElements((prev) => [...prev, <MessageBubble key={prev.length} role="assistant" text={step.text} />]);
          setLiveElement(null);
          await delay(PAUSE_BETWEEN);
        }
      }
    }

    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div
      className="w-full max-w-[560px] bg-surface border-2 border-primary/20 overflow-hidden"
      style={{ animation: "widget-enter 0.4s ease-out both" }}
    >
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-highlight">Agent Chat</span>
          <span className="text-[10px] px-1.5 py-0.5 border border-secondary/30 text-text/40">claude-4.5-sonnet</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text/30 font-mono">1.2K tokens</span>
          <span className="text-[10px] px-1.5 py-0.5 border border-highlight/30 text-highlight/60">online</span>
        </div>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex flex-col gap-3 p-4 min-h-[380px] max-h-[480px] overflow-y-auto">
        {elements}
        {liveElement}
      </div>

      {/* Input bar */}
      <div className="flex gap-2 px-4 py-3 border-t border-primary/20">
        <div className="flex-1 bg-background border border-primary/30 px-3 py-2 text-sm text-text/40">
          Message Marty...
        </div>
        <div className="bg-primary px-4 py-2 text-sm text-text/60 font-medium">Send</div>
      </div>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function MessageBubble({
  role,
  text,
  typing = false,
}: {
  role: "user" | "assistant";
  text: string;
  typing?: boolean;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "items-end justify-end" : "items-start justify-start"}`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 text-sm ${
          isUser
            ? "bg-primary text-text"
            : "bg-surface text-text border border-primary/20"
        }`}
        style={{ animation: typing ? undefined : "float-in 0.3s ease-out both" }}
      >
        <FormattedText text={text} />
        {typing && (
          <span className="inline-block w-0.5 h-4 bg-highlight/60 ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="whitespace-pre-wrap">
      {lines.map((line, i) => {
        if (line.startsWith("- ")) {
          const content = line.slice(2);
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-text/30 mt-0.5 shrink-0">&bull;</span>
              <span>{renderBold(content)}</span>
            </div>
          );
        }
        if (line.startsWith("> ")) {
          return (
            <div key={i} className="border-l-2 border-primary pl-3 my-1 text-text/60">
              {line.slice(2)}
            </div>
          );
        }
        if (line === "") return <div key={i} className="h-1" />;
        return <div key={i}>{renderBold(line)}</div>;
      })}
    </div>
  );
}

function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} className="font-semibold text-highlight">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
}

function ThinkingTrace({ steps }: { steps: { label: string; content: string }[] }) {
  const [open, setOpen] = useState(true);

  const labelColor = (label: string) => {
    if (label === "Tool Call") return "text-highlight";
    if (label === "Tool Result") return "text-secondary";
    return "text-secondary";
  };

  return (
    <div className="w-full max-w-[80%] border border-primary/20 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2 text-xs font-medium text-text/60 hover:bg-surface/50 transition-colors"
      >
        <span>Thinking Trace ({steps.length} steps)</span>
        <span
          className="text-text/30 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-2 px-4 pb-3" style={{ animation: "slide-down 0.2s ease-out" }}>
          {steps.map((s, i) => (
            <div key={i} className="text-xs">
              <span className={`font-medium ${labelColor(s.label)}`}>{s.label}</span>
              <pre className="mt-1 whitespace-pre-wrap text-text/50 font-mono text-[11px] leading-relaxed">
                {s.content}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
