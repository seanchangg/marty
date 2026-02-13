"use client";

import React from "react";
import { useVaultSelection } from "@/hooks/useVaultSelection";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getTypeBadge(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    pdf: "PDF", json: "JSON", csv: "CSV", txt: "TXT", md: "MD",
    py: "Python", js: "JS", ts: "TS", html: "HTML", xml: "XML",
    yaml: "YAML", yml: "YAML",
  };
  return map[ext] || ext.toUpperCase() || "FILE";
}

function VaultWidget() {
  const { files, loading, selectedFiles, toggleFile } = useVaultSelection();

  return (
    <div className="flex flex-col bg-surface border border-primary/20 h-full">
      <div className="border-b border-primary/20 px-4 py-2.5 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-highlight">
          Vault
          <span className="ml-1.5 text-text/30 font-normal">{files.length}</span>
        </h2>
        {selectedFiles.size > 0 && (
          <span className="text-xs text-highlight/50">
            {selectedFiles.size} file{selectedFiles.size !== 1 ? "s" : ""} selected
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <p className="text-xs text-text/25 text-center py-6">Loading...</p>
        ) : files.length === 0 ? (
          <p className="text-xs text-text/25 text-center py-6">
            No files uploaded. Go to /vault to upload documents.
          </p>
        ) : (
          <table className="w-full text-xs table-fixed">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary/20 bg-background">
                <th className="w-8 px-2 py-1.5" />
                <th className="text-left px-2 py-1.5 text-text/40 font-medium">Name</th>
                <th className="text-left px-2 py-1.5 text-text/40 font-medium w-16">Type</th>
                <th className="text-right px-2 py-1.5 text-text/40 font-medium w-16">Size</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr
                  key={file.filename}
                  onClick={() => toggleFile(file.filename)}
                  className={`border-b border-primary/10 cursor-pointer transition-colors ${
                    selectedFiles.has(file.filename)
                      ? "bg-highlight/8"
                      : "hover:bg-primary/5"
                  }`}
                >
                  <td className="px-2 py-1.5 text-center">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.filename)}
                      onChange={() => toggleFile(file.filename)}
                      className="accent-[#A8D5BA]"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-text/70 truncate">
                    {file.filename}
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="text-[10px] text-secondary bg-primary/20 px-1 py-0.5">
                      {getTypeBadge(file.filename)}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-right text-text/40 font-mono">
                    {formatSize(file.size)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedFiles.size > 0 && (
        <div className="border-t border-primary/20 px-4 py-2 shrink-0">
          <p className="text-xs text-highlight/50">
            {selectedFiles.size} file{selectedFiles.size !== 1 ? "s" : ""} will be
            included with your next message
          </p>
        </div>
      )}
    </div>
  );
}

export default React.memo(VaultWidget);
