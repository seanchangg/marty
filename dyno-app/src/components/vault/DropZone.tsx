"use client";

import { useState, useCallback, useRef } from "react";

interface DropZoneProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

/** Recursively collect all files from a dropped directory entry. */
async function readEntryFiles(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file(
        (f) => resolve([f]),
        () => resolve([]),
      );
    });
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const entries = await new Promise<FileSystemEntry[]>((resolve) => {
      const all: FileSystemEntry[] = [];
      const readBatch = () => {
        reader.readEntries((batch) => {
          if (batch.length === 0) {
            resolve(all);
          } else {
            all.push(...batch);
            readBatch();
          }
        }, () => resolve(all));
      };
      readBatch();
    });
    const nested = await Promise.all(entries.map(readEntryFiles));
    return nested.flat();
  }
  return [];
}

export default function DropZone({ onUpload, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      setError(null);
      const valid = files.filter((f) => f.size <= MAX_FILE_SIZE && f.size > 0);
      const skipped = files.length - valid.length;

      if (valid.length === 0) {
        setError(skipped > 0 ? "All files exceeded 200MB or were empty" : "No files found");
        return;
      }

      setUploading(true);
      let uploaded = 0;
      let failed = 0;

      for (const file of valid) {
        setProgress(`Uploading ${uploaded + 1}/${valid.length}: ${file.name}`);
        try {
          await onUpload(file);
          uploaded++;
        } catch (err) {
          failed++;
          console.warn("Upload failed:", file.name, err);
        }
      }

      setProgress(null);
      setUploading(false);

      if (failed > 0 || skipped > 0) {
        const parts: string[] = [];
        if (failed > 0) parts.push(`${failed} failed`);
        if (skipped > 0) parts.push(`${skipped} skipped (too large or empty)`);
        setError(`Uploaded ${uploaded}/${files.length} — ${parts.join(", ")}`);
      }
    },
    [onUpload],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled || uploading) return;

      // Try webkitGetAsEntry for folder support
      const items = e.dataTransfer.items;
      if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === "function") {
        const entries: FileSystemEntry[] = [];
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry();
          if (entry) entries.push(entry);
        }
        const allFiles = (await Promise.all(entries.map(readEntryFiles))).flat();
        if (allFiles.length > 0) {
          handleFiles(allFiles);
          return;
        }
      }

      // Fallback: plain file list
      const fileList = Array.from(e.dataTransfer.files);
      if (fileList.length > 0) {
        handleFiles(fileList);
      }
    },
    [disabled, uploading, handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleFiles(files);
    e.target.value = "";
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      className={`border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
        dragging
          ? "border-highlight bg-highlight/5"
          : "border-primary/30 hover:border-secondary"
      } ${disabled || uploading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />
      {uploading ? (
        <p className="text-sm text-text/60">{progress || "Uploading..."}</p>
      ) : (
        <>
          <p className="text-sm text-text/60">
            Drop files or folders here, or click to browse
          </p>
          <p className="text-xs text-text/30 mt-1">Max 200MB per file</p>
        </>
      )}
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
