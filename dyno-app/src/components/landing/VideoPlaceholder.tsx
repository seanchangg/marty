"use client";

interface VideoPlaceholderProps {
  label: string;
  /** Aspect ratio as "w/h", e.g. "16/9" */
  aspect?: string;
}

export default function VideoPlaceholder({
  label,
  aspect = "16/9",
}: VideoPlaceholderProps) {
  return (
    <div
      className="w-full bg-surface border-2 border-primary/20 flex items-center justify-center relative overflow-hidden"
      style={{ aspectRatio: aspect }}
    >
      {/* Play button */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 border-2 border-highlight/30 flex items-center justify-center">
          <div
            className="w-0 h-0 ml-1"
            style={{
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderLeft: "16px solid rgba(168, 213, 186, 0.4)",
            }}
          />
        </div>
        <span className="text-xs text-text/25 font-mono tracking-wider uppercase">
          {label}
        </span>
      </div>

      {/* Corner marks */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-primary/30" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-primary/30" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-primary/30" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-primary/30" />
    </div>
  );
}
