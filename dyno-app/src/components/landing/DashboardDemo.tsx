"use client";

import { useEffect, useState, useRef } from "react";

interface MiniWidget {
  title: string;
  id: string;
  colSpan: number;
  content: React.ReactNode;
}

const WIDGETS: MiniWidget[] = [
  {
    title: "Agent Control",
    id: "wgt-control",
    colSpan: 1,
    content: (
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text/40">Status</span>
          <span className="text-xs px-1.5 py-0.5 border border-highlight/30 text-highlight/70">Online</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text/40">Uptime</span>
          <span className="text-xs text-text/50">4h 23m</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-text/40">Tasks Today</span>
          <span className="text-xs text-text/50">12</span>
        </div>
        <div className="h-px bg-primary/15 my-1" />
        <div className="flex gap-1.5 h-12 items-end">
          {[38, 52, 44, 60, 55, 48, 65, 58, 70, 62, 75, 68].map((h, i) => (
            <div key={i} className="flex-1 flex items-end">
              <div className="w-full bg-highlight/20 transition-all duration-500" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Memory Table",
    id: "wgt-memory",
    colSpan: 1,
    content: (
      <div className="flex flex-col px-4 py-3">
        <div className="flex text-[10px] text-text/30 border-b border-primary/15 pb-1.5 mb-2">
          <span className="flex-1">Key</span>
          <span className="flex-[2]">Value</span>
        </div>
        {[
          ["user.name", "Sean"],
          ["user.timezone", "America/Los_Angeles"],
          ["pref.theme", "dark"],
          ["last.deploy", "2h ago"],
          ["agent.model", "claude-4.5-sonnet"],
        ].map(([k, v]) => (
          <div key={k} className="flex text-xs py-1 border-b border-primary/8">
            <span className="flex-1 text-highlight/40 font-mono">{k}</span>
            <span className="flex-[2] text-text/50">{v}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Agent Chat",
    id: "wgt-chat",
    colSpan: 2,
    content: (
      <div className="flex flex-col gap-2.5 px-4 py-3">
        <div className="flex gap-2 items-start">
          <div className="max-w-[70%] bg-primary px-3 py-2 text-xs text-text ml-auto">
            Summarize my emails
          </div>
        </div>
        <div className="flex gap-2 items-start">
          <div className="max-w-[70%] bg-surface border border-primary/20 px-3 py-2 text-xs text-text/70">
            You have 3 unread — 1 from Alex about the deploy, 2 newsletters. Want me to draft a reply to Alex?
          </div>
        </div>
        <div className="flex gap-2 mt-1">
          <div className="flex-1 h-7 bg-background border border-primary/30 px-2 text-[10px] text-text/30 flex items-center">
            Message Marty...
          </div>
          <div className="bg-primary px-3 py-1 text-[10px] text-text/60 font-medium flex items-center">Send</div>
        </div>
      </div>
    ),
  },
  {
    title: "Vault",
    id: "wgt-vault",
    colSpan: 1,
    content: (
      <div className="flex flex-col gap-2 px-4 py-3">
        {[
          ["deploy.sh", "2.1 KB", "2m ago"],
          ["notes.md", "840 B", "1h ago"],
          ["config.json", "1.4 KB", "3h ago"],
          [".env.local", "256 B", "1d ago"],
        ].map(([name, size, time]) => (
          <div key={name} className="flex items-center justify-between">
            <span className="text-xs text-text/50 font-mono">{name}</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-text/25">{size}</span>
              <span className="text-[10px] text-text/20">{time}</span>
            </div>
          </div>
        ))}
        <div className="h-px bg-primary/15 mt-1" />
        <div className="text-[10px] text-text/25">4 files — 4.6 KB total</div>
      </div>
    ),
  },
  {
    title: "Code Runner",
    id: "wgt-code",
    colSpan: 1,
    content: (
      <div className="px-4 py-3">
        <pre className="text-xs text-text/50 font-mono leading-relaxed">
          <span className="text-secondary/70">const</span> agent = <span className="text-secondary/70">new</span>{" "}
          <span className="text-highlight/60">Marty</span>();{"\n"}
          <span className="text-secondary/70">const</span> result = <span className="text-secondary/70">await</span>{" "}
          agent.<span className="text-highlight/60">run</span>({"\n"}
          {"  "}<span className="text-text/30">&quot;check deploy status&quot;</span>{"\n"}
          );{"\n"}
          <span className="text-text/30">{"// "}=&gt; {"{ status: 'ready', checks: 4 }"}</span>
        </pre>
      </div>
    ),
  },
];

const POP_DELAY = 300; // ms between each widget appearing

export default function DashboardDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    let count = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        count++;
        setVisibleCount(count);
        if (count >= WIDGETS.length) clearInterval(interval);
      }, POP_DELAY);
    }, 800);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className="w-full max-w-[560px]"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
      }}
    >
      {WIDGETS.map((w, i) => (
        <div
          key={w.id}
          className="overflow-hidden"
          style={{
            gridColumn: `span ${w.colSpan}`,
            opacity: i < visibleCount ? 1 : 0,
            transform: i < visibleCount ? "scale(1)" : "scale(0.92)",
            transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
          }}
        >
          <div className="widget-inner h-full">
            {/* Drag handle bar — matches real widget */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-primary/10 bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="flex flex-col gap-0.5">
                  <div className="w-5 h-[1.5px] bg-text/10" />
                  <div className="w-5 h-[1.5px] bg-text/10" />
                </div>
                <span className="text-[10px] text-text/30 font-mono">{w.id}</span>
              </div>
              <span className="text-[10px] text-text/20 font-mono">{w.title}</span>
            </div>

            {w.content}
          </div>
        </div>
      ))}
    </div>
  );
}
