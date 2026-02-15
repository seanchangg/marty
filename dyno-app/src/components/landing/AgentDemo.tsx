"use client";

import { useEffect, useState, useRef } from "react";

interface ActivityRow {
  time: string;
  tool: string;
  session: string;
  status: "ok" | "err";
  duration: string;
  detail?: string;
}

const ROWS: ActivityRow[] = [
  {
    time: "2s ago",
    tool: "calendar.getEvents",
    session: "sess_8f3a2b",
    status: "ok",
    duration: "240ms",
    detail: '{ date: "today", limit: 10 }',
  },
  {
    time: "5s ago",
    tool: "drafts.create",
    session: "sess_8f3a2b",
    status: "ok",
    duration: "180ms",
    detail: '{ channel: "#engineering", content: "Deploy at 5pm..." }',
  },
  {
    time: "12s ago",
    tool: "memory.get",
    session: "sess_8f3a2b",
    status: "ok",
    duration: "45ms",
    detail: '{ key: "user.timezone" }',
  },
  {
    time: "18s ago",
    tool: "shell.exec",
    session: "sess_c41f9d",
    status: "ok",
    duration: "1.2s",
    detail: "npm run test -- --bail",
  },
  {
    time: "34s ago",
    tool: "files.write",
    session: "sess_c41f9d",
    status: "ok",
    duration: "92ms",
    detail: '{ path: "deploy-notes.md", size: "1.4KB" }',
  },
  {
    time: "41s ago",
    tool: "git.commit",
    session: "sess_c41f9d",
    status: "ok",
    duration: "340ms",
    detail: '{ message: "chore: update deploy notes" }',
  },
  {
    time: "55s ago",
    tool: "slack.send",
    session: "sess_8f3a2b",
    status: "err",
    duration: "2.1s",
    detail: "Error: rate_limited — retry after 30s",
  },
  {
    time: "1m ago",
    tool: "memory.set",
    session: "sess_8f3a2b",
    status: "ok",
    duration: "38ms",
    detail: '{ key: "last.deploy", value: "now" }',
  },
  {
    time: "1m ago",
    tool: "health.check",
    session: "sess_c41f9d",
    status: "ok",
    duration: "120ms",
  },
  {
    time: "2m ago",
    tool: "files.read",
    session: "sess_c41f9d",
    status: "ok",
    duration: "28ms",
    detail: '{ path: "config.json" }',
  },
];

const ROW_DELAY = 350;

type Tab = "activity" | "sessions" | "tokens";

const SESSIONS = [
  {
    id: "sess_8f3a2b",
    started: "4m ago",
    status: "active" as const,
    tools: 5,
    tokens: 2_840,
    errors: 1,
    lastTool: "calendar.getEvents",
  },
  {
    id: "sess_c41f9d",
    started: "12m ago",
    status: "active" as const,
    tools: 5,
    tokens: 4_120,
    errors: 0,
    lastTool: "files.read",
  },
  {
    id: "sess_a02e71",
    started: "1h ago",
    status: "closed" as const,
    tools: 18,
    tokens: 9_600,
    errors: 2,
    lastTool: "git.push",
  },
];

const TOKEN_ROWS = [
  { model: "claude-4.5-sonnet", input: 3_240, output: 1_680, cost: "$0.024" },
  { model: "claude-4.5-sonnet", input: 2_100, output: 940, cost: "$0.015" },
  { model: "claude-4.5-sonnet", input: 1_820, output: 1_100, cost: "$0.014" },
  { model: "claude-4.5-haiku", input: 4_600, output: 2_200, cost: "$0.007" },
];

export default function AgentDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("activity");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    let count = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        count++;
        setVisibleCount(count);
        if (count >= ROWS.length) clearInterval(interval);
      }, ROW_DELAY);
    }, 800);

    return () => clearTimeout(timeout);
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "activity", label: "Activity" },
    { key: "sessions", label: "Sessions" },
    { key: "tokens", label: "Tokens" },
  ];

  return (
    <div
      className="w-full max-w-[600px] bg-surface border-2 border-primary/20 overflow-hidden"
      style={{ animation: "widget-enter 0.4s ease-out both" }}
    >
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-highlight">Agent Activity</span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text/30 font-mono">{visibleCount} events</span>
          <span className="text-[10px] px-1.5 py-0.5 border border-secondary/30 text-secondary/70">live</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-primary/20 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs transition-colors ${
              activeTab === tab.key
                ? "text-highlight border-b-2 border-highlight"
                : "text-text/40 hover:text-text/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "activity" && <ActivityTab visibleCount={visibleCount} expandedRow={expandedRow} setExpandedRow={setExpandedRow} />}
      {activeTab === "sessions" && <SessionsTab />}
      {activeTab === "tokens" && <TokensTab />}
    </div>
  );
}

/* ── Activity Tab ──────────────────────────────────────────────── */

function ActivityTab({
  visibleCount,
  expandedRow,
  setExpandedRow,
}: {
  visibleCount: number;
  expandedRow: number | null;
  setExpandedRow: (i: number | null) => void;
}) {
  return (
    <>
      <div className="flex items-center px-4 py-2 border-b border-primary/15 text-[10px] text-text/30 font-mono">
        <span className="w-[60px]">Time</span>
        <span className="flex-1">Tool</span>
        <span className="w-[90px]">Session</span>
        <span className="w-[40px] text-center">Status</span>
        <span className="w-[60px] text-right">Duration</span>
      </div>

      <div className="min-h-[360px] max-h-[420px] overflow-y-auto">
        {ROWS.slice(0, visibleCount).map((row, i) => (
          <div key={i}>
            <div
              className="flex items-center px-4 py-2 border-b border-primary/5 hover:bg-primary/5 cursor-pointer transition-colors"
              style={{ animation: "float-in 0.3s ease-out both" }}
              onClick={() => setExpandedRow(expandedRow === i ? null : i)}
            >
              <span className="w-[60px] text-[11px] text-text/30">{row.time}</span>
              <span className="flex-1 text-[11px] text-highlight font-mono">{row.tool}</span>
              <span className="w-[90px] text-[11px] text-text/25 font-mono">{row.session}</span>
              <span className={`w-[40px] text-center text-[11px] ${
                row.status === "ok" ? "text-highlight" : "text-red-400"
              }`}>
                {row.status}
              </span>
              <span className="w-[60px] text-right text-[11px] text-text/40 font-mono">{row.duration}</span>
            </div>

            {expandedRow === i && row.detail && (
              <div
                className="px-4 py-2 bg-background/50 border-b border-primary/10"
                style={{ animation: "slide-down 0.2s ease-out" }}
              >
                <pre className="text-[11px] text-text/40 font-mono whitespace-pre-wrap">{row.detail}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Sessions Tab ──────────────────────────────────────────────── */

function SessionsTab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      <div className="flex items-center px-4 py-2 border-b border-primary/15 text-[10px] text-text/30 font-mono">
        <span className="w-[100px]">Session</span>
        <span className="flex-1">Started</span>
        <span className="w-[50px] text-center">Tools</span>
        <span className="w-[60px] text-center">Tokens</span>
        <span className="w-[50px] text-right">Status</span>
      </div>

      <div className="min-h-[360px] max-h-[420px] overflow-y-auto">
        {SESSIONS.map((s) => (
          <div key={s.id}>
            <div
              className="flex items-center px-4 py-2 border-b border-primary/5 hover:bg-primary/5 cursor-pointer transition-colors"
              style={{ animation: "float-in 0.3s ease-out both" }}
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            >
              <span className="w-[100px] text-[11px] text-highlight font-mono">{s.id}</span>
              <span className="flex-1 text-[11px] text-text/30">{s.started}</span>
              <span className="w-[50px] text-center text-[11px] text-text/50">{s.tools}</span>
              <span className="w-[60px] text-center text-[11px] text-text/40 font-mono">{s.tokens.toLocaleString()}</span>
              <span className={`w-[50px] text-right text-[11px] ${
                s.status === "active" ? "text-highlight" : "text-text/25"
              }`}>
                {s.status}
              </span>
            </div>

            {expanded === s.id && (
              <div
                className="px-4 py-2 bg-background/50 border-b border-primary/10 flex flex-col gap-1"
                style={{ animation: "slide-down 0.2s ease-out" }}
              >
                <div className="flex justify-between text-[11px]">
                  <span className="text-text/30">Last tool</span>
                  <span className="text-text/50 font-mono">{s.lastTool}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-text/30">Errors</span>
                  <span className={s.errors > 0 ? "text-red-400" : "text-text/50"}>{s.errors}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

/* ── Tokens Tab ────────────────────────────────────────────────── */

function TokensTab() {
  return (
    <>
      {/* Summary bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/15">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-text/30">Total In</span>
            <span className="text-xs text-text/60 font-mono">11,760</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text/30">Total Out</span>
            <span className="text-xs text-text/60 font-mono">5,920</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-text/30">Est. Cost</span>
            <span className="text-xs text-highlight font-mono">$0.060</span>
          </div>
        </div>
      </div>

      {/* Table header */}
      <div className="flex items-center px-4 py-2 border-b border-primary/15 text-[10px] text-text/30 font-mono">
        <span className="flex-1">Model</span>
        <span className="w-[70px] text-right">Input</span>
        <span className="w-[70px] text-right">Output</span>
        <span className="w-[60px] text-right">Cost</span>
      </div>

      <div className="min-h-[360px] max-h-[420px] overflow-y-auto">
        {TOKEN_ROWS.map((row, i) => (
          <div
            key={i}
            className="flex items-center px-4 py-2 border-b border-primary/5 transition-colors"
            style={{ animation: "float-in 0.3s ease-out both" }}
          >
            <span className="flex-1 text-[11px] text-highlight font-mono">{row.model}</span>
            <span className="w-[70px] text-right text-[11px] text-text/40 font-mono">{row.input.toLocaleString()}</span>
            <span className="w-[70px] text-right text-[11px] text-text/40 font-mono">{row.output.toLocaleString()}</span>
            <span className="w-[60px] text-right text-[11px] text-text/50 font-mono">{row.cost}</span>
          </div>
        ))}

        {/* Usage bar chart */}
        <div className="px-4 py-4">
          <div className="text-[10px] text-text/30 mb-2">Usage by call (tokens)</div>
          <div className="flex gap-1 items-end h-16">
            {[3240, 2100, 1820, 4600, 1680, 940, 1100, 2200, 800, 1400, 2600, 1900].map((v, i) => (
              <div key={i} className="flex-1 flex items-end">
                <div
                  className="w-full bg-highlight/20 transition-all duration-500"
                  style={{ height: `${(v / 4600) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
