"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStorageFiles } from "@/hooks/useStorageFiles";

interface HtmlFilePickerProps {
  onSelect: (filename: string) => void;
  onClose: () => void;
}

export default function HtmlFilePicker({ onSelect, onClose }: HtmlFilePickerProps) {
  const { user } = useAuth();
  const userId = user?.id;

  const { files: widgetFiles, loading: widgetsLoading } = useStorageFiles(userId, "widgets");
  const { files: workspaceFiles, loading: workspaceLoading } = useStorageFiles(userId, "workspace");

  const loading = widgetsLoading || workspaceLoading;

  const htmlFiles = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];

    // Files from the dedicated widgets bucket
    for (const f of widgetFiles) {
      if (f.filename.endsWith(".html")) {
        seen.add(f.filename);
        result.push(f.filename);
      }
    }

    // Files from workspace bucket under widgets/ prefix
    for (const f of workspaceFiles) {
      if (f.filename.startsWith("widgets/") && f.filename.endsWith(".html")) {
        const name = f.filename.slice("widgets/".length);
        if (!seen.has(name)) {
          seen.add(name);
          result.push(name);
        }
      }
    }

    return result.sort();
  }, [widgetFiles, workspaceFiles]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-80 max-h-96 bg-surface border border-primary/30 shadow-lg flex flex-col">
        <div className="px-4 py-3 border-b border-primary/30 flex items-center justify-between">
          <span className="text-sm text-text font-medium">Select HTML Widget</span>
          <button
            onClick={onClose}
            className="text-text/50 hover:text-highlight transition-colors cursor-pointer text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-text/40 text-sm">
              Loading files...
            </div>
          ) : htmlFiles.length === 0 ? (
            <div className="px-4 py-8 text-center text-text/40 text-sm">
              No HTML widgets found
            </div>
          ) : (
            htmlFiles.map((filename) => (
              <button
                key={filename}
                onClick={() => onSelect(filename)}
                className="w-full text-left px-4 py-2.5 text-sm text-text/70 hover:bg-primary/20 hover:text-highlight transition-colors cursor-pointer border-b border-primary/10 last:border-b-0"
              >
                {filename}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
