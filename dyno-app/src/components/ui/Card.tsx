import { clsx } from "clsx";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx("bg-surface border border-primary/20 p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}
