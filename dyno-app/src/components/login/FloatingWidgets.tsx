"use client";

import { useEffect, useRef } from "react";

interface FloatingWidget {
  title: string;
  x: string;
  y: string;
  width: number;
  height: number;
  scale: number;
  depth: number;
  delay: number;
  bobDuration: number;
  bobX: number;
  bobY: number;
  content: React.ReactNode;
}

const WIDGETS: FloatingWidget[] = [
  {
    title: "Chat",
    x: "4%",
    y: "12%",
    width: 260,
    height: 155,
    scale: 1.1,
    depth: 0.025,
    delay: 0.4,
    bobDuration: 18,
    bobX: 14,
    bobY: 10,
    content: (
      <div className="flex flex-col gap-2 px-3 py-2">
        <div className="flex gap-2 items-start">
          <div className="w-1.5 h-1.5 mt-1 bg-highlight/40 shrink-0" />
          <div className="text-[10px] text-text/30">Summarize my emails</div>
        </div>
        <div className="flex gap-2 items-start">
          <div className="w-1.5 h-1.5 mt-1 bg-secondary/40 shrink-0" />
          <div className="text-[10px] text-highlight/25">You have 3 unread — 1 from Alex about the deploy, 2 newsletters.</div>
        </div>
        <div className="flex gap-2 items-start">
          <div className="w-1.5 h-1.5 mt-1 bg-highlight/40 shrink-0" />
          <div className="text-[10px] text-text/30">Draft a reply to Alex</div>
        </div>
        <div className="h-px bg-primary/20 mt-1" />
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-5 bg-background/50 border border-primary/15" />
          <div className="text-[9px] text-text/15 px-1.5">Send</div>
        </div>
      </div>
    ),
  },
  {
    title: "Agent Control",
    x: "74%",
    y: "8%",
    width: 250,
    height: 135,
    scale: 0.95,
    depth: 0.035,
    delay: 0.6,
    bobDuration: 22,
    bobX: -12,
    bobY: 16,
    content: (
      <div className="flex flex-col gap-1.5 px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-text/25">Status</span>
          <span className="text-[9px] text-highlight/40">Online</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-text/25">Uptime</span>
          <span className="text-[9px] text-text/20">4h 23m</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-text/25">Tasks today</span>
          <span className="text-[9px] text-text/20">12</span>
        </div>
        <div className="h-px bg-primary/15 my-0.5" />
        <div className="flex gap-1 h-8">
          {[38, 52, 44, 60, 55, 48, 65, 58, 70, 62].map((h, i) => (
            <div key={i} className="flex-1 flex items-end">
              <div className="w-full bg-highlight/15" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    title: "Memory Table",
    x: "78%",
    y: "58%",
    width: 240,
    height: 140,
    scale: 1.2,
    depth: 0.03,
    delay: 0.8,
    bobDuration: 25,
    bobX: 10,
    bobY: -14,
    content: (
      <div className="flex flex-col px-3 py-2">
        <div className="flex text-[8px] text-text/20 border-b border-primary/15 pb-1 mb-1.5">
          <span className="flex-1">Key</span>
          <span className="flex-[2]">Value</span>
        </div>
        {[
          ["user.name", "Sean"],
          ["user.tz", "America/LA"],
          ["pref.theme", "dark"],
          ["last.deploy", "2h ago"],
        ].map(([k, v]) => (
          <div key={k} className="flex text-[9px] py-0.5 border-b border-primary/8">
            <span className="flex-1 text-highlight/20 font-mono">{k}</span>
            <span className="flex-[2] text-text/20">{v}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    title: "Vault",
    x: "2%",
    y: "60%",
    width: 220,
    height: 125,
    scale: 0.85,
    depth: 0.04,
    delay: 1.0,
    bobDuration: 20,
    bobX: -16,
    bobY: 8,
    content: (
      <div className="flex flex-col gap-1.5 px-3 py-2">
        {[
          ["deploy.sh", "2.1 KB"],
          ["notes.md", "840 B"],
          ["config.json", "1.4 KB"],
        ].map(([name, size]) => (
          <div key={name} className="flex items-center justify-between">
            <span className="text-[9px] text-text/25 font-mono">{name}</span>
            <span className="text-[8px] text-text/15">{size}</span>
          </div>
        ))}
        <div className="h-px bg-primary/15 mt-0.5" />
        <div className="text-[8px] text-text/15">3 files — 4.3 KB total</div>
      </div>
    ),
  },
];

const REPULSION_RADIUS = 180;
const REPULSION_STRENGTH = 1.2;
const DAMPING = 0.92;
const SPRING = 0.03;

export default function FloatingWidgets() {
  const outerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const offsetsRef = useRef(WIDGETS.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 })));
  const animRef = useRef(0);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    const tick = () => {
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (let i = 0; i < WIDGETS.length; i++) {
        const el = outerRefs.current[i];
        if (!el) continue;
        const o = offsetsRef.current[i];

        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - mx;
        const dy = cy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < REPULSION_RADIUS && dist > 0) {
          const force = (1 - dist / REPULSION_RADIUS) * REPULSION_STRENGTH;
          o.vx += (dx / dist) * force;
          o.vy += (dy / dist) * force;
        }

        // Spring back to origin
        o.vx -= o.x * SPRING;
        o.vy -= o.y * SPRING;

        // Damping
        o.vx *= DAMPING;
        o.vy *= DAMPING;

        o.x += o.vx;
        o.y += o.vy;

        el.style.transform = `translate(${o.x}px, ${o.y}px)`;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    animRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none overflow-hidden">
      {WIDGETS.map((w, i) => (
        <div
          key={i}
          ref={(el) => { outerRefs.current[i] = el; }}
          className="absolute"
          style={{
            left: w.x,
            top: w.y,
            transition: "transform 0.3s ease-out",
          }}
        >
          <div style={{ animation: `float-in 0.6s ease-out ${w.delay}s both` }}>
            <div
              className="bg-surface/60 border border-primary/15 backdrop-blur-sm overflow-hidden"
              style={{
                width: w.width * w.scale,
                height: w.height * w.scale,
                animation: `widget-drift-${i} ${w.bobDuration}s ease-in-out infinite`,
                animationDelay: `${w.delay}s`,
              }}
            >
              <div className="flex items-center px-2.5 py-1.5 bg-primary/10 border-b border-primary/10">
                <span className="text-[9px] text-text/25 font-mono">{w.title}</span>
              </div>
              {w.content}
            </div>
          </div>
        </div>
      ))}

      <style>{WIDGETS.map((w, i) => `
        @keyframes widget-drift-${i} {
          0%, 100% { transform: translate(0px, 0px); }
          25% { transform: translate(${w.bobX}px, ${w.bobY * 0.6}px); }
          50% { transform: translate(${w.bobX * 0.4}px, ${w.bobY}px); }
          75% { transform: translate(${-w.bobX * 0.5}px, ${w.bobY * 0.3}px); }
        }
      `).join("")}</style>
    </div>
  );
}
