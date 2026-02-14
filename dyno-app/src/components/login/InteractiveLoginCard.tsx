"use client";

import { useRef, useEffect } from "react";
import Card from "@/components/ui/Card";

interface InteractiveLoginCardProps {
  children: React.ReactNode;
}

const MAX_TILT = 8;

export default function InteractiveLoginCard({ children }: InteractiveLoginCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const nx = (e.clientX - cx) / (window.innerWidth / 2);
      const ny = (e.clientY - cy) / (window.innerHeight / 2);

      const rotateY = nx * MAX_TILT;
      const rotateX = -ny * MAX_TILT;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      card.style.transition = "transform 0.15s ease-out";
    };

    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, []);

  return (
    <div
      className="relative z-20 w-full max-w-md"
      style={{ animation: "card-entrance 0.6s ease-out both" }}
    >
      <Card
        ref={cardRef}
        className="w-full max-w-md relative border-2 border-primary"
        style={{ willChange: "transform" }}
      >
        {children}
      </Card>
    </div>
  );
}
