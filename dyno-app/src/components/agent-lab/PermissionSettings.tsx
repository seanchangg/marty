"use client";

import type { PermissionMode, ToolPermissions } from "@/types";

interface PermissionSettingsProps {
  permissions: ToolPermissions;
  onChange: (permissions: ToolPermissions) => void;
}

const TOOL_LABELS: Record<keyof ToolPermissions, string> = {
  write_file: "Write File",
  modify_file: "Modify File",
  install_package: "Install Package",
  read_file: "Read File",
  list_files: "List Files",
  take_screenshot: "Take Screenshot",
  read_upload: "Read Upload",
  fetch_url: "Fetch URL",
};

export default function PermissionSettings({
  permissions,
  onChange,
}: PermissionSettingsProps) {
  const toggle = (tool: keyof ToolPermissions) => {
    const next: PermissionMode =
      permissions[tool] === "auto" ? "manual" : "auto";
    onChange({ ...permissions, [tool]: next });
  };

  return (
    <div className="bg-surface border border-primary/20 p-4">
      <h3 className="text-xs font-semibold text-text/70 mb-3">
        Tool Permissions
      </h3>
      <div className="flex flex-col gap-2">
        {(Object.keys(TOOL_LABELS) as (keyof ToolPermissions)[]).map((tool) => (
          <div key={tool} className="flex items-center justify-between">
            <span className="text-sm text-text/80">{TOOL_LABELS[tool]}</span>
            <button
              onClick={() => toggle(tool)}
              className={`text-xs font-medium px-3 py-1 transition-colors ${
                permissions[tool] === "auto"
                  ? "bg-highlight/20 text-highlight"
                  : "bg-primary/20 text-text/60"
              }`}
            >
              {permissions[tool] === "auto" ? "Auto" : "Manual"}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-text/30 mt-3">
        Auto: tool executes without approval. Manual: requires your approval.
      </p>
    </div>
  );
}
