"use client";

import HeroSection from "@/components/landing/HeroSection";
import FeatureSection from "@/components/landing/FeatureSection";
import VideoPlaceholder from "@/components/landing/VideoPlaceholder";
import WidgetPanorama from "@/components/landing/WidgetPanorama";
import DynoSprite from "@/components/sprite/DynoSprite";
import LandingCTA from "@/components/landing/LandingCTA";
import { useInView } from "@/components/landing/useInView";

export default function LandingPage() {
  return (
    <div className="bg-background" style={{ scrollBehavior: "smooth" }}>
      {/* Hero */}
      <HeroSection />

      {/* Section 1: Plug in your Claude */}
      <PlugInSection />

      {/* Section 2: Configure Context */}
      <FeatureSection
        title="Configure Context"
        description="Give your agent the knowledge it needs. Define memory, link integrations, and set behavioral rules — so it understands your world from day one."
      >
        <VideoPlaceholder label="Demo — Context Configuration" />
      </FeatureSection>

      {/* Section 3: Customize your Dashboard */}
      <FeatureSection
        title="Customize your Dashboard"
        description="Drag, resize, and arrange widgets on an infinite canvas. Build the control center that fits how you think — not the other way around."
        reverse
      >
        <VideoPlaceholder label="Demo — Dashboard Customization" />
      </FeatureSection>

      {/* Section 4: Manage Side-Assistants */}
      <FeatureSection
        title="Manage Side-Assistants"
        description="Spin up focused sub-agents for specific jobs — research, scheduling, code review. Each one runs independently and reports back to your main agent."
      >
        <VideoPlaceholder label="Demo — Side-Assistants" />
      </FeatureSection>

      {/* Section 5: CREATE ANYTHING */}
      <CreateAnythingSection />

      {/* Footer CTA */}
      <section className="flex flex-col items-center justify-center py-32 gap-8">
        <DynoSprite status="working" size={64} noTrack />

        <LandingCTA onClick={() => { window.location.href = "/login"; }}>
          Get Started
        </LandingCTA>

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
      id="features-start"
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

/* ── CREATE ANYTHING ───────────────────────────────────────────── */

function CreateAnythingSection() {
  const [ref, isInView] = useInView(0.1);

  return (
    <section ref={ref} className="min-h-screen flex flex-col items-center justify-center py-32 overflow-hidden">
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
          Widgets are code. If you can describe it, Marty can build it —
          dashboards, tools, visualizations, automations. No templates, no
          limits. Just tell your agent what you need.
        </p>
      </div>

      {/* Panorama — full viewport width, no container constraints */}
      <div className="w-screen">
        <WidgetPanorama />
      </div>

      {/* Capability hints — constrained */}
      <div
        className="grid grid-cols-3 gap-8 max-w-5xl w-full px-8 mt-16"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 1s ease-out 0.3s, transform 1s ease-out 0.3s",
        }}
      >
        {[
          {
            title: "Live Data Widgets",
            desc: "Pull from any API and render it in real time. Weather, stocks, CI pipelines — anything with an endpoint.",
          },
          {
            title: "Custom Tools",
            desc: "Build internal tools that connect to your stack. Database queries, deployment triggers, log viewers.",
          },
          {
            title: "Automations",
            desc: "Chain actions together. When X happens, do Y. Marty handles the wiring, you set the rules.",
          },
        ].map((item) => (
          <div key={item.title} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-highlight/80">
              {item.title}
            </h3>
            <p className="text-xs text-text/40 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
