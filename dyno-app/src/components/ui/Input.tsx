"use client";

import { clsx } from "clsx";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-text/70">
          {label}
        </label>
      )}
      <input
        id={id}
        className={clsx(
          "bg-background border border-primary/30 px-3 py-2 text-text placeholder:text-text/40 focus:outline-none focus:border-highlight transition-colors",
          className
        )}
        {...props}
      />
    </div>
  );
}
