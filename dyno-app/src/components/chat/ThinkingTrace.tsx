"use client";

import Collapsible from "@/components/ui/Collapsible";
import type { ThinkingStep } from "@/types";

interface ThinkingTraceProps {
  steps: ThinkingStep[];
}

const stepLabels: Record<string, string> = {
  thought: "Thinking",
  tool_call: "Tool Call",
  tool_result: "Tool Result",
};

export default function ThinkingTrace({ steps }: ThinkingTraceProps) {
  if (!steps.length) return null;

  return (
    <Collapsible title={`Thinking Trace (${steps.length} steps)`}>
      <div className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <div key={i} className="text-xs">
            <span className="font-medium text-secondary">
              {stepLabels[step.type] || step.type}
            </span>
            <pre className="mt-1 whitespace-pre-wrap text-text/60 font-sans">
              {step.content}
            </pre>
          </div>
        ))}
      </div>
    </Collapsible>
  );
}
