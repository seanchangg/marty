"use client";

import React, { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

interface HtmlWidgetProps {
  html?: string;
  src?: string;
  title?: string;
}

function HtmlWidget({ html, src, title = "HTML Widget" }: HtmlWidgetProps) {
  const { user } = useAuth();

  // Auto-inject userId into widget-html API URLs so cloud mode can find the file
  const resolvedSrc = useMemo(() => {
    if (!src) return undefined;
    if (!user?.id) return src;
    // Only inject for our own widget-html API route
    if (src.startsWith("/api/widget-html/") && !src.includes("userId=")) {
      const separator = src.includes("?") ? "&" : "?";
      return `${src}${separator}userId=${encodeURIComponent(user.id)}`;
    }
    return src;
  }, [src, user?.id]);

  if (resolvedSrc) {
    return (
      <iframe
        src={resolvedSrc}
        title={title}
        sandbox="allow-scripts allow-same-origin"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "transparent",
        }}
      />
    );
  }

  if (html) {
    return (
      <iframe
        srcDoc={html}
        title={title}
        sandbox="allow-scripts"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "transparent",
        }}
      />
    );
  }

  return (
    <div className="h-full flex items-center justify-center text-text/50 text-sm">
      No HTML content provided
    </div>
  );
}

export default React.memo(HtmlWidget);
