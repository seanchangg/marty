"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import type { Widget } from "@/types/widget";

const MINIMAP_W = 200;
const MINIMAP_MAX_H = 140;
const WORLD_PADDING = 400;
const MIN_WORLD = 1600;

interface MinimapProps {
  widgets: Widget[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
  zoomScale: number;
  baseSnapX: number;
  baseSnapY: number;
  gap: number;
}

export default function Minimap({
  widgets,
  scrollRef,
  zoomScale,
  baseSnapX,
  baseSnapY,
  gap,
}: MinimapProps) {
  const minimapRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [collapsed, setCollapsed] = useState(false);

  // ── Viewport tracking ───────────────────────────────────────────────────

  const updateViewport = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setViewport({
      x: el.scrollLeft / zoomScale,
      y: el.scrollTop / zoomScale,
      w: el.clientWidth / zoomScale,
      h: el.clientHeight / zoomScale,
    });
  }, [scrollRef, zoomScale]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateViewport();
    el.addEventListener("scroll", updateViewport, { passive: true });
    window.addEventListener("resize", updateViewport);
    return () => {
      el.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
    };
  }, [scrollRef, updateViewport]);

  // ── World bounds ────────────────────────────────────────────────────────

  let contentRight = 0;
  let contentBottom = 0;
  for (const w of widgets) {
    contentRight = Math.max(contentRight, (w.x + w.w) * baseSnapX);
    contentBottom = Math.max(contentBottom, (w.y + w.h) * baseSnapY);
  }

  const worldW = Math.max(contentRight, viewport.x + viewport.w, MIN_WORLD) + WORLD_PADDING;
  const worldH = Math.max(contentBottom, viewport.y + viewport.h, MIN_WORLD) + WORLD_PADDING;

  const scaleX = MINIMAP_W / worldW;
  const scaleY = MINIMAP_MAX_H / worldH;
  const scale = Math.min(scaleX, scaleY);

  const renderedW = Math.ceil(worldW * scale);
  const renderedH = Math.ceil(worldH * scale);

  // ── Navigation ──────────────────────────────────────────────────────────

  const navigateTo = useCallback(
    (clientX: number, clientY: number) => {
      const el = scrollRef.current;
      const mm = minimapRef.current;
      if (!el || !mm) return;

      const rect = mm.getBoundingClientRect();
      const mx = (clientX - rect.left) / scale;
      const my = (clientY - rect.top) / scale;

      el.scrollLeft = (mx - viewport.w / 2) * zoomScale;
      el.scrollTop = (my - viewport.h / 2) * zoomScale;
    },
    [scrollRef, scale, zoomScale, viewport.w, viewport.h],
  );

  // Keep a ref so drag listeners always call the latest version
  const navigateRef = useRef(navigateTo);
  navigateRef.current = navigateTo;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      navigateRef.current(e.clientX, e.clientY);

      const handleMouseMove = (ev: MouseEvent) => {
        navigateRef.current(ev.clientX, ev.clientY);
      };
      const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    },
    [],
  );

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-end gap-0">
      {/* Toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="text-[10px] font-mono text-text/40 hover:text-highlight/70 transition-colors cursor-pointer px-2 py-0.5 bg-surface/90 border border-highlight/30 border-b-0 select-none"
      >
        {collapsed ? "map" : "map"}
      </button>

      {/* Map */}
      {!collapsed && (
        <div
          ref={minimapRef}
          className="relative cursor-crosshair border border-highlight/30 bg-background/90 select-none"
          style={{ width: renderedW, height: renderedH }}
          onMouseDown={handleMouseDown}
        >
          {/* Widget blocks */}
          {widgets.map((w) => {
            const left = w.x * baseSnapX * scale;
            const top = w.y * baseSnapY * scale;
            const width = Math.max((w.w * baseSnapX - gap) * scale, 2);
            const height = Math.max((w.h * baseSnapY - gap) * scale, 2);
            return (
              <div
                key={w.id}
                className="absolute bg-primary/50"
                style={{ left, top, width, height }}
              />
            );
          })}

          {/* Viewport indicator */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: viewport.x * scale,
              top: viewport.y * scale,
              width: viewport.w * scale,
              height: viewport.h * scale,
              border: "1px solid rgba(168, 213, 186, 0.5)",
              background: "rgba(168, 213, 186, 0.06)",
            }}
          />
        </div>
      )}
    </div>
  );
}
