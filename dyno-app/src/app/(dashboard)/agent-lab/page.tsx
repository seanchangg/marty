"use client";

import { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EventStream from "@/components/agent-lab/EventStream";
import ProposedActionsList from "@/components/agent-lab/ProposedActionsList";
import PermissionSettings from "@/components/agent-lab/PermissionSettings";
import { useBuildSession } from "@/hooks/useBuildSession";
import { useServerStatus } from "@/hooks/useServerStatus";
import { useAuth } from "@/hooks/useAuth";
import { getDecryptedApiKey } from "@/lib/crypto";
import AttachmentArea from "@/components/agent-lab/AttachmentArea";
import type { ToolPermissions, Attachment } from "@/types";

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

// Sonnet pricing for actual cost display
const COST_INPUT_PER_TOKEN = 3 / 1_000_000;
const COST_OUTPUT_PER_TOKEN = 15 / 1_000_000;

const DEFAULT_PERMISSIONS: ToolPermissions = {
  write_file: "manual",
  modify_file: "manual",
  install_package: "manual",
  read_file: "auto",
  list_files: "auto",
  take_screenshot: "auto",
  read_upload: "auto",
  fetch_url: "auto",
};

const COMPLEXITY_COLORS: Record<string, string> = {
  trivial: "bg-highlight/15 text-highlight/70",
  simple: "bg-highlight/15 text-highlight/70",
  moderate: "bg-secondary/20 text-secondary",
  complex: "bg-danger/15 text-danger/80",
  ambitious: "bg-danger/20 text-danger",
};

export default function AgentLabPage() {
  const { profile } = useAuth();
  const server = useServerStatus();
  const {
    events,
    proposals,
    isRunning,
    isPlanning,
    planResult,
    buildTokens,
    summary,
    requestPlan,
    clearPlan,
    startBuild,
    approve,
    deny,
    cancel,
    reset,
  } = useBuildSession();

  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(true);
  const [permissions, setPermissions] =
    useState<ToolPermissions>(DEFAULT_PERMISSIONS);
  const [showPermissions, setShowPermissions] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const promptRef = useRef(prompt);
  promptRef.current = prompt;

  // Decrypt API key on mount
  useEffect(() => {
    async function loadKey() {
      if (profile?.encrypted_api_key) {
        const key = await getDecryptedApiKey(profile.encrypted_api_key);
        setApiKey(key);
      }
      setApiKeyLoading(false);
    }
    loadKey();
  }, [profile]);

  const handlePlan = () => {
    if (!prompt.trim() || !apiKey || isPlanning || isRunning) return;
    requestPlan(prompt.trim(), apiKey, undefined, attachments, profile?.id);
  };

  const handleBuild = () => {
    if (!apiKey || isRunning) return;
    // Use the prompt that was planned, or current prompt
    const buildPrompt = promptRef.current.trim() || "proceed with the plan";
    startBuild(buildPrompt, apiKey, undefined, attachments, profile?.id);
  };

  const handleEditPrompt = () => {
    clearPlan();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (planResult && !isRunning) {
        handleBuild();
      } else {
        handlePlan();
      }
    }
  };

  const hasActivity = events.length > 0 || proposals.length > 0;
  const plan = planResult?.plan;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-highlight">Agent Lab</h1>
          <button
            onClick={server.refresh}
            className="flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-80 transition-opacity"
            title={
              server.online
                ? `Uptime: ${server.uptime ? formatUptime(server.uptime) : "—"} · ${server.activeSessions} active session${server.activeSessions !== 1 ? "s" : ""}`
                : "Bot server offline — click to retry"
            }
          >
            <span
              className={`inline-block w-2 h-2 ${server.online ? "bg-highlight" : "bg-danger"}`}
              style={
                server.online
                  ? { animation: "pulse-glow 3s ease-in-out infinite" }
                  : undefined
              }
            />
            <span
              className={server.online ? "text-text/50" : "text-danger/70"}
            >
              {server.online ? "Bot Online" : "Bot Offline"}
            </span>
          </button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowPermissions(!showPermissions)}
            className="text-xs px-3 py-1.5"
          >
            {showPermissions ? "Hide Permissions" : "Permissions"}
          </Button>
          {(hasActivity || planResult) && !isRunning && (
            <Button
              variant="ghost"
              onClick={() => { reset(); setAttachments([]); }}
              className="text-xs px-3 py-1.5"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Permission settings */}
      {showPermissions && (
        <div className="mb-4">
          <PermissionSettings
            permissions={permissions}
            onChange={setPermissions}
          />
        </div>
      )}

      {/* Warnings */}
      {!server.online && (
        <Card className="mb-4 border-danger/30">
          <p className="text-sm text-danger">
            Bot server is offline. Start it with:{" "}
            <code className="text-xs bg-background px-1.5 py-0.5">
              cd python && python ws_server.py
            </code>
          </p>
        </Card>
      )}
      {!apiKeyLoading && !apiKey && (
        <Card className="mb-4 border-danger/30">
          <p className="text-sm text-danger">
            No API key found. Go to Settings to configure your Anthropic API
            key.
          </p>
        </Card>
      )}

      {/* Prompt input */}
      <Card className="mb-6">
        <h2 className="text-sm font-semibold text-text/70 mb-3">
          Build Something
        </h2>
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (planResult) clearPlan();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want the agent to build..."
          rows={3}
          disabled={isRunning}
          className="w-full resize-none bg-background border border-primary/30 px-3 py-2 text-sm text-text placeholder:text-text/40 focus:outline-none focus:border-highlight transition-colors mb-3 disabled:opacity-50"
        />

        <div className="mb-3">
          <AttachmentArea
            attachments={attachments}
            onAdd={(att) => setAttachments((prev) => [...prev, att])}
            onRemove={(id) =>
              setAttachments((prev) => prev.filter((a) => a.id !== id))
            }
            disabled={isRunning}
          />
        </div>

        <div className="flex items-center gap-3">
          {!isRunning && !planResult && (
            <Button
              onClick={handlePlan}
              disabled={
                !prompt.trim() || !apiKey || !server.online || isPlanning
              }
            >
              {isPlanning ? "Planning..." : "Plan"}
            </Button>
          )}
          {!isRunning && planResult && (
            <>
              <Button
                onClick={handleBuild}
                disabled={!apiKey || !server.online}
              >
                Build
              </Button>
              <Button variant="ghost" onClick={handleEditPrompt}>
                Edit Prompt
              </Button>
            </>
          )}
          {isRunning && (
            <>
              <Button variant="secondary" onClick={cancel}>
                Cancel
              </Button>
              <span
                className="text-xs text-secondary"
                style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
              >
                Agent is working...
              </span>
              {buildTokens.iteration > 0 && (
                <span className="text-xs text-text/30 ml-auto">
                  iter {buildTokens.iteration} · {buildTokens.totalIn.toLocaleString()} in / {buildTokens.totalOut.toLocaleString()} out · $
                  {(
                    buildTokens.totalIn * COST_INPUT_PER_TOKEN +
                    buildTokens.totalOut * COST_OUTPUT_PER_TOKEN
                  ).toFixed(4)}
                </span>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Plan result */}
      {plan && !isRunning && (
        <Card className="mb-6 border-primary/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-text/70">Build Plan</h2>
            <span
              className={`text-xs font-medium px-1.5 py-0.5 ${
                COMPLEXITY_COLORS[plan.complexity] ||
                "bg-secondary/20 text-secondary"
              }`}
            >
              {plan.complexity}
            </span>
          </div>

          <p className="text-sm text-text/80 mb-3">{plan.summary}</p>

          {/* Steps */}
          <div className="flex flex-col gap-1.5 mb-3">
            {plan.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-text/30 w-4 shrink-0 text-right">
                  {i + 1}.
                </span>
                <span className="font-mono text-highlight/60 shrink-0">
                  {step.tool}
                </span>
                <span className="text-text/50">
                  {step.target && (
                    <span className="text-text/70">{step.target}</span>
                  )}
                  {step.target && " — "}
                  {step.description}
                </span>
              </div>
            ))}
          </div>

          {/* Files & packages */}
          <div className="flex gap-4 mb-3">
            {plan.files.length > 0 && (
              <div className="text-xs">
                <span className="text-text/40">Files: </span>
                <span className="text-text/60 font-mono">
                  {plan.files.join(", ")}
                </span>
              </div>
            )}
            {plan.packages.length > 0 && (
              <div className="text-xs">
                <span className="text-text/40">Packages: </span>
                <span className="text-text/60 font-mono">
                  {plan.packages.join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Cost breakdown */}
          <div className="border-t border-primary/15 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-xs text-text/40">
                <span>~{plan.estimatedIterations} iterations</span>
                <span>
                  ~{((plan.estimatedInputTokens + plan.estimatedOutputTokens) / 1000).toFixed(0)}k
                  tokens
                </span>
              </div>
              <span className="text-sm font-medium text-text/70">
                Est. ${plan.estimatedCost}
              </span>
            </div>
            {plan.reasoning && (
              <p className="text-xs text-text/25 mt-1.5">{plan.reasoning}</p>
            )}
            {planResult && (
              <p className="text-xs text-text/20 mt-1">
                Planning cost: ${planResult.planCost.toFixed(4)} (
                {planResult.planTokensIn + planResult.planTokensOut} tokens)
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Available tools — live from server */}
      <div className="bg-surface border border-primary/20 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-text/70">
            Available Tools
          </h2>
          <span className="text-xs text-text/30">
            {server.tools.length} tools
          </span>
        </div>
        {server.tools.length === 0 && (
          <p className="text-xs text-text/30">
            {server.online ? "No tools loaded." : "Server offline."}
          </p>
        )}
        <div className="grid grid-cols-1 gap-2">
          {server.tools.map((tool) => (
            <div
              key={tool.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-xs bg-primary/30 text-highlight px-1.5 py-0.5 shrink-0">
                  {tool.name}
                </span>
                <span className="text-text/50 text-xs truncate">
                  {tool.description}
                </span>
              </div>
              <span
                className={`text-xs shrink-0 ml-3 ${
                  tool.mode === "auto" ? "text-highlight/60" : "text-text/40"
                }`}
              >
                {tool.mode}
              </span>
            </div>
          ))}
        </div>
        {server.tools.length > 0 && (
          <p className="text-xs text-text/25 mt-3">
            Auto tools run without approval. Manual tools require your
            confirmation before executing.
          </p>
        )}
      </div>

      {/* Event stream */}
      {hasActivity && (
        <div className="mb-4">
          <EventStream events={events} />
        </div>
      )}

      {/* Proposals */}
      {proposals.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-text/70 mb-3">
            Proposed Actions
          </h2>
          <ProposedActionsList
            proposals={proposals}
            onApprove={approve}
            onDeny={deny}
          />
        </div>
      )}

      {/* Summary */}
      {summary && (
        <Card className="border-highlight/20">
          <h2 className="text-sm font-semibold text-highlight/70 mb-2">
            Build Complete
          </h2>
          <p className="text-sm text-text/70">{summary.text}</p>
          <div className="flex gap-4 text-xs text-text/30 mt-2">
            <span>
              {summary.tokensIn.toLocaleString()} in /{" "}
              {summary.tokensOut.toLocaleString()} out
            </span>
            <span>
              Actual cost: $
              {(
                summary.tokensIn * COST_INPUT_PER_TOKEN +
                summary.tokensOut * COST_OUTPUT_PER_TOKEN
              ).toFixed(4)}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
