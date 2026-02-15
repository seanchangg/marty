"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";

/* ── Screenshot data ─────────────────────────────────────────────────────── *
 *
 * To add more screenshots:
 *   1. Drop the image into  public/showcase/
 *   2. Add an entry to ROW_1 or ROW_2 below
 *   3. Set width to the image's pixel width / 2  (retina)
 *      height is shared across each row (ROW_HEIGHT)
 *
 * ────────────────────────────────────────────────────────────────────────── */

const ROW_HEIGHT = 420; // display px — adjust this to scale the panorama

interface ShowcaseItem {
  id: string;
  prompt: string;
  image: string;
  /** Original image pixel dimensions (used to compute aspect-correct display width) */
  pw: number;
  ph: number;
}

// Display width is computed: (pw / ph) * ROW_HEIGHT
const ROW_1: ShowcaseItem[] = [
  { id: "flashcards",   prompt: "Make me a flashcard widget I can study with",                                           image: "/showcase/flashcards.png",   pw: 1036, ph: 1046 },
  { id: "weather-map",  prompt: "Build a weather widget that shows weather trends all across the world",             image: "/showcase/weather-map.png",  pw: 1828, ph: 1046 },
  { id: "music-player", prompt: "Build me a widget where I can search and play songs",                            image: "/showcase/music-player.png", pw: 1568, ph: 1052 },
  { id: "kanban",       prompt: "Create a kanban board so I can organize my tasks into columns",                                 image: "/showcase/kanban.png",       pw: 1836, ph: 1042 },
  { id: "sec-analyzer", prompt: "I need a tool that pulls SEC 10-K filings and breaks down the financials for any stock ticker", image: "/showcase/sec-analyzer.png", pw: 1836, ph: 1038 },
];

const ROW_2: ShowcaseItem[] = [
  { id: "pomodoro",     prompt: "Make me a pomodoro timer with work and break sessions",                                         image: "/showcase/pomodoro.png",     pw: 1036, ph: 1048 },
  { id: "ai-papers",    prompt: "Show me the top AI papers published this week with summaries",                                  image: "/showcase/ai-papers.png",    pw: 1828, ph: 1038 },
  { id: "cot-report",   prompt: "Build a widget parses Commision of Traders reports",    image: "/showcase/cot-report.png",   pw: 1834, ph: 1044 },
  { id: "news-podcast", prompt: "Make a news widget that generates a podcast from today's headlines",                             image: "/showcase/news-podcast.png", pw: 1828, ph: 1050 },
  { id: "grant-finder", prompt: "Build a grant finder",         image: "/showcase/grant-finder.png", pw: 1560, ph: 1052 },
];

function displayWidth(item: ShowcaseItem): number {
  return Math.round((item.pw / item.ph) * ROW_HEIGHT);
}

/* ── Card ────────────────────────────────────────────────────────────────── */

function Card({ item }: { item: ShowcaseItem }) {
  const w = displayWidth(item);
  return (
    <div
      className="flex-shrink-0 overflow-hidden border-2 border-primary/20 bg-surface relative group"
      style={{ width: w, height: ROW_HEIGHT }}
    >
      <Image
        src={item.image}
        alt={item.id}
        width={w}
        height={ROW_HEIGHT}
        className="object-cover w-full h-full transition-[filter] duration-300 group-hover:brightness-[0.3]"
        unoptimized
      />
      {/* Hover overlay — shows the prompt used to create this widget */}
      <div className="absolute inset-0 flex items-center justify-center px-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-primary/80 border border-primary/40 px-5 py-4 max-w-md">
          <p className="text-sm text-text/80 leading-relaxed italic">
            &ldquo;{item.prompt}&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Marquee row ─────────────────────────────────────────────────────────── */

const GAP = 20;

function totalSetWidth(items: ShowcaseItem[]): number {
  return items.reduce((sum, item) => sum + displayWidth(item) + GAP, 0);
}

function MarqueeRow({
  items,
  direction,
  speed,
}: {
  items: ShowcaseItem[];
  direction: "left" | "right";
  speed: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);
  const oneSet = totalSetWidth(items);

  // Enough copies to fill 2x the widest common monitor (3840px ultrawide)
  const copies = Math.ceil(8000 / oneSet) + 1;

  useEffect(() => {
    if (direction === "right") posRef.current = -oneSet;

    const animate = () => {
      if (direction === "left") {
        posRef.current -= speed;
        if (posRef.current <= -oneSet) posRef.current += oneSet;
      } else {
        posRef.current += speed;
        if (posRef.current >= 0) posRef.current -= oneSet;
      }
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${posRef.current}px)`;
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [oneSet, direction, speed]);

  return (
    <div className="overflow-hidden w-full">
      <div ref={trackRef} className="flex will-change-transform" style={{ gap: GAP }}>
        {Array.from({ length: copies }, (_, ci) =>
          items.map((item) => (
            <Card key={`${ci}-${item.id}`} item={item} />
          ))
        )}
      </div>
    </div>
  );
}

/* ── Panorama ────────────────────────────────────────────────────────────── */

export default function WidgetPanorama() {
  return (
    <div className="flex flex-col gap-5 w-full">
      <MarqueeRow items={ROW_1} direction="left" speed={0.5} />
      <MarqueeRow items={ROW_2} direction="right" speed={0.4} />
    </div>
  );
}
