"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useVaultFiles, type VaultFile } from "./useVaultFiles";
import { useAuth } from "./useAuth";
import { useToast } from "@/components/ui/ToastProvider";

interface VaultSelectionContextValue {
  files: VaultFile[];
  loading: boolean;
  selectedFiles: Set<string>;
  toggleFile: (filename: string) => void;
  clearSelection: () => void;
  refresh: () => void;
  uploadFile: (file: File) => Promise<void>;
  deleteFile: (filename: string) => Promise<void>;
  /** Fetch text content for selected files and return as context string. */
  getSelectedContext: () => Promise<string>;
}

const VaultSelectionContext = createContext<VaultSelectionContextValue | null>(null);

export function VaultSelectionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { files, loading, refresh, uploadFile, deleteFile } = useVaultFiles(user?.id, {
    onError: (msg) => toast(msg, "error"),
  });
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  const toggleFile = useCallback((filename: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const handleDelete = useCallback(
    async (filename: string) => {
      await deleteFile(filename);
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        next.delete(filename);
        return next;
      });
    },
    [deleteFile],
  );

  const getSelectedContext = async () => {
    if (!user?.id || selectedFiles.size === 0) return "";

    const parts: string[] = [];
    for (const filename of selectedFiles) {
      try {
        const res = await fetch(
          `/api/uploads/preview?filename=${encodeURIComponent(filename)}&userId=${encodeURIComponent(user.id)}`,
        );
        if (res.ok) {
          const text = await res.text();
          parts.push(`[file: ${filename}]\n${text}`);
        }
      } catch {
        // skip files that fail to load
      }
    }
    return parts.join("\n\n---\n\n");
  };

  return (
    <VaultSelectionContext.Provider
      value={{
        files,
        loading,
        selectedFiles,
        toggleFile,
        clearSelection,
        refresh,
        uploadFile,
        deleteFile: handleDelete,
        getSelectedContext,
      }}
    >
      {children}
    </VaultSelectionContext.Provider>
  );
}

export function useVaultSelection() {
  const ctx = useContext(VaultSelectionContext);
  if (!ctx) {
    throw new Error("useVaultSelection must be used within a <VaultSelectionProvider>");
  }
  return ctx;
}
