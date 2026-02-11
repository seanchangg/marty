"use client";

import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export default function Collapsible({
  title,
  children,
  defaultOpen = false,
  className,
}: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={clsx("border border-primary/20", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium text-text/80 hover:bg-surface/50 transition-colors"
      >
        {title}
        <ChevronDown
          size={16}
          className={clsx(
            "transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div
          className="px-4 pb-3 overflow-hidden"
          style={{ animation: "slide-down 0.2s ease-out" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
