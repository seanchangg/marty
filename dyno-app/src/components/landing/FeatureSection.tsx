"use client";

import { useInView } from "./useInView";

interface FeatureSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
  /** Flip layout: mock on left, text on right */
  reverse?: boolean;
}

export default function FeatureSection({
  title,
  description,
  children,
  reverse = false,
}: FeatureSectionProps) {
  const [ref, isInView] = useInView(0.1);

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-8 py-24"
    >
      <div
        className={`flex items-center gap-20 max-w-6xl w-full ${
          reverse ? "flex-row-reverse" : ""
        }`}
        style={{ flexWrap: "wrap" }}
      >
        {/* Text side */}
        <div
          className="min-w-[280px]"
          style={{
            flex: "0 1 340px",
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(32px)",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
          }}
        >
          <h2 className="text-3xl font-bold text-highlight mb-4 tracking-wide">
            {title}
          </h2>
          <p className="text-text/60 text-lg leading-relaxed">
            {description}
          </p>
        </div>

        {/* Mock side — larger */}
        <div
          className="flex-1 min-w-[420px] flex justify-center"
          style={{
            opacity: isInView ? 1 : 0,
            transform: isInView ? "translateY(0)" : "translateY(32px)",
            transition: "opacity 0.7s ease-out 0.15s, transform 0.7s ease-out 0.15s",
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
