"use client";

import { useState, useMemo, Fragment } from "react";
import type { Memory } from "@/hooks/useMemories";

interface MemoryPanelProps {
  memories: Memory[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (tag: string, content: string) => void;
}

export default function MemoryPanel({
  memories,
  selectedIds,
  onToggle,
  onDelete,
  onSave,
}: MemoryPanelProps) {
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newContent, setNewContent] = useState("");
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());

  // Group memories by tag, sort tags alphabetically
  const grouped = useMemo(() => {
    const map = new Map<string, Memory[]>();
    for (const m of memories) {
      const list = map.get(m.tag) || [];
      list.push(m);
      map.set(m.tag, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [memories]);

  const toggleTag = (tag: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const toggleTagSelection = (tag: string, mems: Memory[]) => {
    const allSelected = mems.every((m) => selectedIds.has(m.id));
    mems.forEach((m) => {
      if (allSelected) {
        if (selectedIds.has(m.id)) onToggle(m.id);
      } else {
        if (!selectedIds.has(m.id)) onToggle(m.id);
      }
    });
  };

  const handleAdd = () => {
    if (!newTag.trim() || !newContent.trim()) return;
    onSave(newTag.trim(), newContent.trim());
    setNewTag("");
    setNewContent("");
    setAdding(false);
  };

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text/50">
          Memories ({memories.length})
        </span>
        <button
          onClick={() => setAdding(!adding)}
          className="text-xs text-highlight/60 hover:text-highlight transition-colors cursor-pointer"
        >
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>

      {/* Compact inline add form */}
      {adding && (
        <div className="flex gap-1.5 items-start">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="tag"
            className="w-24 text-xs bg-background border border-primary/20 px-1.5 py-1 text-text placeholder:text-text/30 focus:outline-none focus:border-highlight font-mono"
          />
          <input
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="content..."
            className="flex-1 text-xs bg-background border border-primary/20 px-1.5 py-1 text-text placeholder:text-text/30 focus:outline-none focus:border-highlight"
          />
          <button
            onClick={handleAdd}
            disabled={!newTag.trim() || !newContent.trim()}
            className="text-xs px-2 py-1 bg-highlight/20 text-highlight border border-highlight/30 hover:bg-highlight/30 transition-colors cursor-pointer disabled:opacity-30 shrink-0"
          >
            Save
          </button>
        </div>
      )}

      {memories.length === 0 && !adding && (
        <p className="text-xs text-text/25">
          No memories yet. The bot can save them, or add your own.
        </p>
      )}

      {/* Table */}
      {grouped.length > 0 && (
        <div className="max-h-[280px] overflow-y-auto border border-primary/15">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-primary/20 bg-background">
                <th className="w-6 px-2 py-1.5" />
                <th className="text-left px-2 py-1.5 text-text/40 font-medium">Tag</th>
                <th className="text-left px-2 py-1.5 text-text/40 font-medium">Content</th>
                <th className="w-6 px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {grouped.map(([tag, mems]) => {
                const isExpanded = expandedTags.has(tag);
                const selectedCount = mems.filter((m) => selectedIds.has(m.id)).length;
                const allSelected = selectedCount === mems.length;

                // Single memory per tag — flat row
                if (mems.length === 1) {
                  const m = mems[0];
                  return (
                    <tr
                      key={m.id}
                      onClick={() => onToggle(m.id)}
                      className={`border-b border-primary/10 cursor-pointer transition-colors ${
                        selectedIds.has(m.id)
                          ? "bg-highlight/8"
                          : "hover:bg-primary/5"
                      }`}
                    >
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(m.id)}
                          onChange={() => onToggle(m.id)}
                          className="accent-[#A8D5BA]"
                        />
                      </td>
                      <td className="px-2 py-1.5 font-mono text-highlight/70 whitespace-nowrap">
                        {m.tag}
                      </td>
                      <td className="px-2 py-1.5 text-text/50 truncate max-w-0">
                        <span className="block truncate">{m.content}</span>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(m.id);
                          }}
                          className="text-text/20 hover:text-danger/60 transition-colors"
                          title="Delete"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  );
                }

                // Multiple memories under same tag — collapsible group
                return (
                  <Fragment key={tag}>
                    <tr
                      onClick={() => toggleTag(tag)}
                      className={`border-b border-primary/10 cursor-pointer transition-colors ${
                        selectedCount > 0 ? "bg-highlight/5" : "hover:bg-primary/5"
                      }`}
                    >
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleTagSelection(tag, mems);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="accent-[#A8D5BA]"
                        />
                      </td>
                      <td className="px-2 py-1.5 font-mono text-highlight/70 whitespace-nowrap">
                        <span className="mr-1 text-text/30 inline-block w-2">{isExpanded ? "v" : ">"}</span>
                        {tag}
                        <span className="ml-1.5 text-text/30">({mems.length})</span>
                      </td>
                      <td className="px-2 py-1.5 text-text/35 truncate max-w-0">
                        {!isExpanded && (
                          <span className="block truncate">
                            {mems.map((m) => m.content).join(" | ")}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1.5" />
                    </tr>
                    {isExpanded &&
                      mems.map((m) => (
                        <tr
                          key={m.id}
                          onClick={() => onToggle(m.id)}
                          className={`border-b border-primary/10 cursor-pointer transition-colors ${
                            selectedIds.has(m.id)
                              ? "bg-highlight/8"
                              : "hover:bg-primary/5"
                          }`}
                        >
                          <td className="px-2 py-1 text-center pl-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(m.id)}
                              onChange={() => onToggle(m.id)}
                              className="accent-[#A8D5BA]"
                            />
                          </td>
                          <td className="px-2 py-1 pl-7 text-text/25 font-mono whitespace-nowrap">
                            &mdash;
                          </td>
                          <td className="px-2 py-1 text-text/50 truncate max-w-0">
                            <span className="block truncate">{m.content}</span>
                          </td>
                          <td className="px-2 py-1 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(m.id);
                              }}
                              className="text-text/20 hover:text-danger/60 transition-colors"
                              title="Delete"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedIds.size > 0 && (
        <p className="text-xs text-highlight/50">
          {selectedIds.size} memor{selectedIds.size === 1 ? "y" : "ies"} will be
          included with your next message
        </p>
      )}
    </div>
  );
}
