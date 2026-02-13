"use client";

import { useState, useRef, useCallback, useEffect, type DragEvent } from "react";
import type { DashboardTab } from "@/types/widget";

interface TabBarProps {
  tabs: DashboardTab[];
  activeTabId: string;
  nonCloseableTabIds?: Set<string>;
  onSwitch: (tabId: string) => void;
  onCreate: () => void;
  onDelete: (tabId: string) => void;
  onRename: (tabId: string, label: string) => void;
  onReorder: (tabId: string, newIndex: number) => void;
}

export default function TabBar({
  tabs,
  activeTabId,
  nonCloseableTabIds,
  onSwitch,
  onCreate,
  onDelete,
  onRename,
  onReorder,
}: TabBarProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragTabIdRef = useRef<string | null>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingTabId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTabId]);

  const startRename = useCallback((tab: DashboardTab) => {
    setEditingTabId(tab.id);
    setEditValue(tab.label);
  }, []);

  const commitRename = useCallback(() => {
    if (editingTabId && editValue.trim()) {
      onRename(editingTabId, editValue.trim());
    }
    setEditingTabId(null);
  }, [editingTabId, editValue, onRename]);

  const handleDragStart = useCallback((e: DragEvent, tabId: string) => {
    dragTabIdRef.current = tabId;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", tabId);
  }, []);

  const handleDragOver = useCallback((e: DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent, dropIndex: number) => {
      e.preventDefault();
      const dragId = dragTabIdRef.current;
      if (dragId) {
        onReorder(dragId, dropIndex);
      }
      dragTabIdRef.current = null;
      setDragOverIndex(null);
    },
    [onReorder]
  );

  const handleDragEnd = useCallback(() => {
    dragTabIdRef.current = null;
    setDragOverIndex(null);
  }, []);

  return (
    <div className="flex items-end gap-0 px-4 pt-2 pb-1 mb-2 border-b border-primary/20 bg-[#121A14]">
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        const isEditing = editingTabId === tab.id;
        const isDragOver = dragOverIndex === index;

        return (
          <div
            key={tab.id}
            draggable={!isEditing}
            onDragStart={(e) => handleDragStart(e, tab.id)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => {
              if (!isEditing) onSwitch(tab.id);
            }}
            onDoubleClick={() => startRename(tab)}
            className={[
              "relative flex items-center gap-2 px-4 py-2 text-sm cursor-pointer select-none transition-colors",
              isActive
                ? "bg-primary/10 text-highlight border-b-2 border-primary"
                : "bg-surface text-text/50 hover:text-text/70 hover:bg-surface/80 border-b-2 border-transparent",
              isDragOver ? "ring-1 ring-primary/40" : "",
            ].join(" ")}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setEditingTabId(null);
                }}
                className="bg-transparent border-b border-highlight text-highlight text-sm outline-none w-24"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate max-w-32">{tab.label}</span>
            )}

            {isActive && tabs.length > 1 && !isEditing && !nonCloseableTabIds?.has(tab.id) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(tab.id);
                }}
                className="text-text/30 hover:text-highlight text-xs transition-colors cursor-pointer ml-1"
              >
                close
              </button>
            )}
          </div>
        );
      })}

      <button
        onClick={onCreate}
        className="px-3 py-2 text-text/30 hover:text-highlight text-sm transition-colors cursor-pointer"
      >
        +
      </button>
    </div>
  );
}
