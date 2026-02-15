"use client";

import HeroSection from "@/components/landing/HeroSection";
import FeatureSection from "@/components/landing/FeatureSection";
import WidgetPanorama from "@/components/landing/WidgetPanorama";
import DynoSprite from "@/components/sprite/DynoSprite";
import LandingCTA from "@/components/landing/LandingCTA";
import { useInView } from "@/components/landing/useInView";

export default function LandingPage() {
  return (
    <div className="bg-background" style={{ scrollBehavior: "smooth" }}>
      {/* Hero */}
      <HeroSection />

      {/* Section 1: CREATE ANYTHING */}
      <CreateAnythingSection />

      {/* Section 2: How It Works */}
      <HowItWorksSection />

      {/* Section 3: Plug in your Claude */}
      <PlugInSection />

      {/* Section 3: Configure Context */}
      <FeatureSection
        title="Configure Context"
        description="Give your agent the knowledge it needs. Define memory, link integrations, and set behavioral rules — so it understands your world from day one."
      >
        <video src="/demo-context.mp4" autoPlay loop muted playsInline className="w-full border-2 border-primary/20" />
      </FeatureSection>

      {/* Section 4: Customize your Dashboard */}
      <FeatureSection
        title="Customize your Dashboard"
        description="Drag, resize, and arrange widgets on an infinite canvas. Build the control center that fits how you think — not the other way around."
        reverse
      >
        <video src="/demo-dashboard.mp4" autoPlay loop muted playsInline className="w-full border-2 border-primary/20" />
      </FeatureSection>

      {/* Section 5: Deploy Mini-Marty's */}
      <FeatureSection
        title="Deploy Mini-Marty's"
        description="Spin up focused sub-marty's (marties?) for specific jobs — research, scheduling, code review. Each one runs independently and reports back to your main agent."
      >
        <video src="/demo-mini-martys.mp4" autoPlay loop muted playsInline className="w-full border-2 border-primary/20" />
      </FeatureSection>

      {/* Footer CTA */}
      <section className="flex flex-col items-center justify-center py-32 gap-12">
        <DynoSprite status="working" size={64} noTrack />

        <button
          onClick={() => { window.location.href = "/login"; }}
          className="text-3xl font-semibold text-text px-16 py-6 bg-primary border-2 border-primary/20 hover:border-highlight/50 hover:scale-105 transition-all duration-300 cursor-pointer"
        >
          Let&apos;s Do It
        </button>

        <p className="text-sm text-text/30">
          Built for humans who want an agent that just works.
        </p>
      </section>
    </div>
  );
}

/* ── Plug In Your Claude ───────────────────────────────────────── */

function PlugInSection() {
  const [ref, isInView] = useInView(0.15);

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-8 py-24"
    >
      <div
        className="flex flex-col items-center gap-12 max-w-3xl w-full"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? "translateY(0)" : "translateY(32px)",
          transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 className="text-4xl font-bold text-highlight tracking-wide">
            Plug in your Claude
          </h2>
          <p className="text-text/60 text-lg leading-relaxed max-w-lg">
            Bring your own API key. Marty connects directly to Claude — no
            middleman, no markup. Your key, your usage, your data.
          </p>
        </div>

        {/* Mock API key input */}
        <div className="w-full max-w-md">
          <div className="bg-surface border-2 border-primary/20 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-primary/15 flex items-center justify-between">
              <span className="text-xs text-text/40 font-mono">
                settings / api
              </span>
              <span className="text-[10px] px-1.5 py-0.5 border border-highlight/30 text-highlight/60">
                encrypted
              </span>
            </div>

            {/* Key input mock */}
            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text/40">
                  Anthropic API Key
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-background border border-primary/30 px-3 py-2 text-sm font-mono text-text/30 flex items-center">
                    sk-ant-api03-••••••••••••••••••••
                  </div>
                  <div className="bg-primary px-4 py-2 text-sm text-text/60 font-medium flex items-center">
                    Connect
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-highlight animate-pulse" />
                <span className="text-xs text-highlight/70">
                  Connected — claude-4.5-sonnet available
                </span>
              </div>

              {/* Model selector mock */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-text/40">Default Model</label>
                <div className="bg-background border border-primary/30 px-3 py-2 text-sm text-text/50 flex items-center justify-between">
                  <span>claude-4.5-sonnet</span>
                  <span className="text-text/20 text-xs">▾</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-text/20 text-center max-w-sm">
          Your key is stored locally and encrypted. Marty never sees or stores
          your API key on our servers.
        </p>
      </div>
    </section>
  );
}

/* ── How It Works ─────────────────────────────────────────────── */

const STEPS = [
  {
    number: "1",
    title: "Describe it",
    detail: "Tell Marty what you need in plain English. A tracker, a dashboard, a workflow — anything.",
  },
  {
    number: "2",
    title: "Marty builds it",
    detail: "Your agent writes the code, connects the data, and assembles a working widget in seconds.",
  },
  {
    number: "3",
    title: "Use it",
    detail: "It lands on your dashboard, ready to go. Tweak it, resize it, or ask Marty to change it anytime.",
  },
];

function HowItWorksSection() {
  const [ref, isInView] = useInView(0.15);

  return (
    <section
      ref={ref}
      className="flex items-center justify-center px-8 py-32"
    >
      <div
        className="flex flex-col items-center gap-16 max-w-4xl w-full"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? "translateY(0)" : "translateY(32px)",
          transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        }}
      >
        <h2 className="text-4xl font-bold text-highlight tracking-wide text-center">
          How it works
        </h2>

        <div className="grid grid-cols-3 gap-12 w-full">
          {STEPS.map((step, i) => (
            <div
              key={step.number}
              className="flex flex-col items-center text-center gap-4"
              style={{
                opacity: isInView ? 1 : 0,
                transform: isInView ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.5s ease-out ${0.2 + i * 0.15}s, transform 0.5s ease-out ${0.2 + i * 0.15}s`,
              }}
            >
              {/* Step number */}
              <div className="w-14 h-14 border-2 border-highlight/30 flex items-center justify-center">
                <span className="text-2xl font-bold text-highlight/70">{step.number}</span>
              </div>

              {/* Connector line (not on last) */}
              <h3 className="text-xl font-semibold text-text/80">{step.title}</h3>
              <p className="text-sm text-text/40 leading-relaxed">{step.detail}</p>
            </div>
          ))}
        </div>

        {/* Connector arrows between steps */}
        <div className="relative w-full -mt-[140px] pointer-events-none hidden lg:flex justify-between px-[120px]">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full h-px bg-primary/20" />
            <div className="w-2 h-2 border-r-2 border-b-2 border-primary/20 rotate-[-45deg] -ml-2 flex-shrink-0" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full h-px bg-primary/20" />
            <div className="w-2 h-2 border-r-2 border-b-2 border-primary/20 rotate-[-45deg] -ml-2 flex-shrink-0" />
          </div>
        </div>

        <div className="w-full mt-8">
          <video src="/demo-how-it-works.mp4" autoPlay loop muted playsInline className="w-full border-2 border-primary/20" />
        </div>
      </div>
    </section>
  );
}

/* ── CREATE ANYTHING ───────────────────────────────────────────── */

function CreateAnythingSection() {
  const [ref, isInView] = useInView(0.1);

  return (
    <section id="features-start" ref={ref} className="min-h-screen flex flex-col items-center justify-center py-32 overflow-hidden">
      {/* Text — constrained */}
      <div
        className="flex flex-col items-center gap-6 text-center px-8 mb-16"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? "translateY(0)" : "translateY(40px)",
          transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
        }}
      >
        <h2 className="text-7xl font-bold text-highlight tracking-[0.15em]">
          CREATE ANYTHING
        </h2>
        <p className="text-text/50 text-xl leading-relaxed max-w-2xl">
          AI agents shouldn&apos;t just be for programmers. Describe what you
          need — a dashboard, a tool, a workflow — and
          Marty builds it for you. No code, no config, no learning curve.
        </p>
      </div>

      {/* Panorama — full viewport width, no container constraints */}
      <div className="w-screen">
        <WidgetPanorama />
      </div>

      <p className="text-2xl font-bold text-text/25 tracking-wide mt-12">
        Built by users. No code involved.
      </p>
    </section>
  );
}
