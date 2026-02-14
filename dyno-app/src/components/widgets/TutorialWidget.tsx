"use client";

import React, { useState } from "react";

const EXAMPLE_PROMPTS = [
  {
    category: "Try it out",
    description: "Simple tasks to see what Marty can do",
    prompts: [
      "Create a music widget that lets me search and play songs",
      "Take a screenshot of https://news.ycombinator.com",
      "What time is it in Tokyo right now? Show me in a widget.",
    ],
  },
  {
    category: "Go deeper",
    description: "Multi-step tasks and agent features",
    prompts: [
      "Interview me about my interests and save what you learn to memories",
      "Spawn a child agent to research the top 5 AI papers this week, then summarize them in a widget",
      "Build a pomodoro timer widget with start/pause/reset",
    ],
  },
  {
    category: "Get creative",
    description: "Push the limits — Marty can build anything",
    prompts: [
      "Build a kanban board widget where I can track my projects",
      "Make a live dashboard that pulls my GitHub activity and shows contribution stats",
      "Rearrange my dashboard — put chat on the left, stats on the right, and make everything bigger",
    ],
  },
  {
    category: "Power user",
    description: "Webhooks let external services talk to Marty automatically",
    prompts: [
      "What are webhooks and how do they work in Marty?",
      "Tell Opus to set up a webhook that triggers when I get a GitHub star and notifies me with a summary",
      "Tell Opus to create a webhook endpoint that accepts form submissions and stores them in a widget",
    ],
  },
];

function TutorialWidget() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(prompt);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Fallback for clipboard API failure
    }
  };

  let globalIndex = 0;

  return (
    <div className="h-full overflow-y-auto bg-surface border border-primary/20 p-4">
      <h2 className="text-base font-semibold text-highlight mb-1">
        Things to try
      </h2>
      <p className="text-xs text-text/40 mb-4">
        Click any prompt to copy it, then paste into the chat.
      </p>

      {EXAMPLE_PROMPTS.map((group) => (
        <div key={group.category} className="mb-4">
          <h3 className="text-[10px] uppercase tracking-wider text-text/30 mb-0.5">
            {group.category}
          </h3>
          <p className="text-[10px] text-text/20 mb-2">{group.description}</p>
          <div className="flex flex-col gap-1.5">
            {group.prompts.map((prompt) => {
              const isCopied = copied === prompt;
              const delay = globalIndex * 0.06;
              globalIndex++;
              return (
                <button
                  key={prompt}
                  onClick={() => handleCopy(prompt)}
                  className="text-left px-3 py-2 text-xs text-text/70 bg-background border border-primary/15 hover:border-primary/40 hover:text-highlight transition-colors cursor-pointer"
                  style={{ animation: `prompt-enter 0.35s ease-out ${delay}s both` }}
                >
                  <span className={isCopied ? "text-highlight" : ""}>
                    {isCopied ? "Copied!" : prompt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <p className="text-[10px] text-text/25 mt-2">
        These are just starting points. Marty can do anything you can describe.
      </p>
    </div>
  );
}

export default React.memo(TutorialWidget);
