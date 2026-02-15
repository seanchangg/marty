"use client";

import { useEffect, useRef } from "react";

interface Shape {
  type: "square" | "rect" | "circle";
  x: string;
  y: string;
  width: number;
  height: number;
  color: string;
  opacity: number;
  depth: number; // parallax multiplier (0.02–0.06)
  spinDuration: number;
  spinDirection: "cw" | "ccw";
  delay: number; // entrance stagger
}

const SHAPES: Shape[] = [
  { type: "square", x: "12%", y: "18%", width: 40, height: 40, color: "#2F5434", opacity: 0.25, depth: 0.03, spinDuration: 35, spinDirection: "cw", delay: 0 },
  { type: "circle", x: "85%", y: "22%", width: 28, height: 28, color: "#5C8A67", opacity: 0.18, depth: 0.05, spinDuration: 45, spinDirection: "ccw", delay: 0.1 },
  { type: "rect", x: "8%", y: "72%", width: 60, height: 24, color: "#A8D5BA", opacity: 0.12, depth: 0.02, spinDuration: 55, spinDirection: "cw", delay: 0.2 },
  { type: "square", x: "78%", y: "75%", width: 32, height: 32, color: "#2F5434", opacity: 0.2, depth: 0.04, spinDuration: 40, spinDirection: "ccw", delay: 0.15 },
  { type: "circle", x: "20%", y: "45%", width: 20, height: 20, color: "#5C8A67", opacity: 0.15, depth: 0.06, spinDuration: 28, spinDirection: "cw", delay: 0.25 },
  { type: "rect", x: "88%", y: "50%", width: 48, height: 18, color: "#A8D5BA", opacity: 0.1, depth: 0.035, spinDuration: 50, spinDirection: "ccw", delay: 0.3 },
  { type: "square", x: "50%", y: "8%", width: 22, height: 22, color: "#1B291E", opacity: 0.3, depth: 0.045, spinDuration: 60, spinDirection: "cw", delay: 0.05 },
  { type: "circle", x: "55%", y: "88%", width: 36, height: 36, color: "#2F5434", opacity: 0.15, depth: 0.025, spinDuration: 38, spinDirection: "ccw", delay: 0.35 },
];

const REPULSION_RADIUS = 120;
const REPULSION_STRENGTH = 0.8;
const DAMPING = 0.9;
const SPRING = 0.04;

export default function FloatingShapes() {
  const shapeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const offsetsRef = useRef(SHAPES.map(() => ({ x: 0, y: 0, vx: 0, vy: 0 })));
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

      for (let i = 0; i < SHAPES.length; i++) {
        const el = shapeRefs.current[i];
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

        o.vx -= o.x * SPRING;
        o.vy -= o.y * SPRING;
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
      {SHAPES.map((s, i) => (
        <div
          key={i}
          ref={(el) => { shapeRefs.current[i] = el; }}
          className="absolute"
          style={{
            left: s.x,
            top: s.y,
            transition: "transform 0.3s ease-out",
          }}
        >
          <div style={{ animation: `float-in 0.7s ease-out ${s.delay}s both` }}>
            <div
              style={{
                width: s.width,
                height: s.height,
                backgroundColor: s.color,
                opacity: s.opacity,
                borderRadius: s.type === "circle" ? "50%" : 0,
                animation: `slow-spin-${s.spinDirection} ${s.spinDuration}s linear infinite`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
