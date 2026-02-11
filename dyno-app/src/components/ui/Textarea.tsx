"use client";

import { clsx } from "clsx";
import { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export default function Textarea({
  label,
  className,
  id,
  ...props
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-text/70">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={clsx(
          "bg-background border border-primary/30 px-3 py-2 text-text placeholder:text-text/40 focus:outline-none focus:border-highlight transition-colors resize-y min-h-[80px]",
          className
        )}
        {...props}
      />
    </div>
  );
}
