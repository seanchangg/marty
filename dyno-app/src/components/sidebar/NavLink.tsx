"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";

interface NavLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
}

export default function NavLink({ href, label, icon: Icon }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors duration-150",
        isActive
          ? "bg-primary/30 text-highlight border-l-2 border-highlight"
          : "text-text/70 hover:bg-surface hover:text-text"
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}
