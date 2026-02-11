"use client";

import { useState, useMemo, Fragment } from "react";
import type { Memory } from "@/hooks/useMemories";

interface MemoryTableProps {
  memories: Memory[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSave: (tag: string, content: string) => void;
}

export default function MemoryTable({
  memories,
  selectedIds,
  onToggle,
  onDelete,
  onSave,
}: MemoryTableProps) {
  const [adding, setAdding] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newContent, setNewContent] = useState("");
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [filterTags, setFilterTags] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // All unique tags sorted alphabetically
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const m of memories) tags.add(m.tag);
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [memories]);

  // Filter memories, then group by tag
  const filtered = useMemo(() => {
    let result = memories;

    if (filterTags.size > 0) {
      result = result.filter((m) => filterTags.has(m.tag));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          m.tag.toLowerCase().includes(q)
      );
    }

    return result;
  }, [memories, filterTags, searchQuery]);

  const grouped = useMemo(() => {
    const map = new Map<string, Memory[]>();
    for (const m of filtered) {
      const list = map.get(m.tag) || [];
      list.push(m);
      map.set(m.tag, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const toggleFilterTag = (tag: string) => {
    setFilterTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const toggleExpandTag = (tag: string) => {
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

  const isFiltering = filterTags.size > 0 || searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col bg-surface border border-primary/20 h-full">
      {/* Header */}
      <div className="border-b border-primary/20 px-4 py-2.5 flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold text-highlight">
          Memories
          <span className="ml-1.5 text-text/30 font-normal">
            {isFiltering
              ? `${filtered.length}/${memories.length}`
              : memories.length}
          </span>
        </h2>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <span className="text-xs text-highlight/50">
              {selectedIds.size} selected
            </span>
          )}
          <button
            onClick={() => setAdding(!adding)}
            className="text-xs text-highlight/60 hover:text-highlight transition-colors cursor-pointer"
          >
            {adding ? "Cancel" : "+ Add"}
          </button>
        </div>
      </div>

      {/* Filter bar: tag chips + search */}
      {memories.length > 0 && (
        <div className="border-b border-primary/20 px-4 py-2 flex flex-col gap-1.5 shrink-0">
          {/* Search */}
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full text-xs bg-background border border-primary/20 px-2 py-1 text-text placeholder:text-text/25 focus:outline-none focus:border-highlight transition-colors"
          />
          {/* Tag chips */}
          {allTags.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {filterTags.size > 0 && (
                <button
                  onClick={() => setFilterTags(new Set())}
                  className="text-[10px] px-1.5 py-0.5 border border-primary/20 text-text/40 hover:text-text/60 transition-colors cursor-pointer"
                >
                  All
                </button>
              )}
              {allTags.map((tag) => {
                const active = filterTags.has(tag);
                const count = memories.filter((m) => m.tag === tag).length;
                return (
                  <button
                    key={tag}
                    onClick={() => toggleFilterTag(tag)}
                    className={`text-[10px] px-1.5 py-0.5 border font-mono transition-colors cursor-pointer ${
                      active
                        ? "border-highlight/40 text-highlight bg-highlight/10"
                        : "border-primary/20 text-text/35 hover:text-text/55 hover:border-primary/35"
                    }`}
                  >
                    {tag}
                    <span className={active ? "text-highlight/50 ml-1" : "text-text/20 ml-1"}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="border-b border-primary/20 px-4 py-2 flex gap-1.5 items-start shrink-0">
          <input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="tag"
            className="w-28 text-xs bg-background border border-primary/20 px-1.5 py-1 text-text placeholder:text-text/30 focus:outline-none focus:border-highlight font-mono"
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

      {/* Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {memories.length === 0 ? (
          <p className="text-xs text-text/25 text-center py-6">
            No memories yet. The bot can save them, or add your own.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-text/25 text-center py-6">
            No memories match your filters.
          </p>
        ) : (
          <table className="w-full text-xs table-fixed">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-primary/20 bg-background">
                <th className="w-8 px-2 py-1.5" />
                <th className="text-left px-2 py-1.5 text-text/40 font-medium w-[130px]">Tag</th>
                <th className="text-left px-2 py-1.5 text-text/40 font-medium">Content</th>
                <th className="w-8 px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {grouped.map(([tag, mems]) => {
                const isExpanded = expandedTags.has(tag);
                const selectedCount = mems.filter((m) => selectedIds.has(m.id)).length;
                const allSelected = selectedCount === mems.length;

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
                      <td className="px-2 py-1.5 font-mono text-highlight/70 truncate">
                        {m.tag}
                      </td>
                      <td className="px-2 py-1.5 text-text/50 truncate">
                        {m.content}
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

                return (
                  <Fragment key={tag}>
                    <tr
                      onClick={() => toggleExpandTag(tag)}
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
                        <span className="mr-1 text-text/30 inline-block w-2.5 text-center">
                          {isExpanded ? "\u25BE" : "\u25B8"}
                        </span>
                        {tag}
                        <span className="ml-1 text-text/30">({mems.length})</span>
                      </td>
                      <td className="px-2 py-1.5 text-text/35 truncate">
                        {!isExpanded && mems.map((m) => m.content).join(" | ")}
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
                          <td className="px-2 py-1 pl-8 text-text/25 font-mono whitespace-nowrap">
                            &mdash;
                          </td>
                          <td className="px-2 py-1 text-text/50 truncate">
                            {m.content}
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
        )}
      </div>
    </div>
  );
}
