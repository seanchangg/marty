"use client";

import { useState } from "react";

interface LandingCTAProps {
  children: React.ReactNode;
  onClick: () => void;
}

export default function LandingCTA({ children, onClick }: LandingCTAProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "12px 32px",
        fontSize: "1.125rem",
        fontWeight: 500,
        color: "#E0E6E1",
        cursor: "pointer",
        border: "2px solid",
        borderColor: hovered
          ? "rgba(168, 213, 186, 0.55)"
          : "rgba(47, 84, 52, 0.2)",
        backgroundColor: "#2F5434",
        transform: hovered ? "scale(1.1)" : "scale(1)",
        transition: "transform 0.3s ease, border-color 0.3s ease",
      }}
    >
      {children}
    </button>
  );
}
