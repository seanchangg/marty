"use client";

import { useEffect, useState } from "react";
import DynoSprite from "@/components/sprite/DynoSprite";
import LoginParticleCanvas from "@/components/login/LoginParticleCanvas";
import LandingCTA from "@/components/landing/LandingCTA";

export default function HeroSection() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Particle background */}
      <LoginParticleCanvas />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Sprite */}
        <div
          className="transition-all duration-700 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <DynoSprite status="online" size={96} />
        </div>

        {/* Title */}
        <div
          className="transition-all duration-700 ease-out delay-150"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <h1 className="text-6xl font-bold tracking-widest text-highlight text-center">
            MARTY
          </h1>
        </div>

        {/* Tagline */}
        <div
          className="transition-all duration-700 ease-out delay-300"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <p className="text-lg text-text/60 text-center max-w">
            A plug and play sandbox for your personal AI agent, because making what you want shouldn't have prerequisites. <br /> No developer background needed, no knowledge of code agents required. <br /> Just ask, and <span className="font-bold text-highlight italic">think big</span>
          </p>
        </div>

        {/* CTA */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.7s ease-out 0.5s",
          }}
        >
          <LandingCTA
            onClick={() => {
              document
                .getElementById("features-start")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Get Started
          </LandingCTA>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 transition-all duration-700 ease-out delay-700"
        style={{
          opacity: visible ? 0.4 : 0,
          transform: visible
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(12px)",
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-text/40 tracking-wider uppercase">Scroll</span>
          <div className="w-px h-8 bg-text/20" />
        </div>
      </div>
    </section>
  );
}
