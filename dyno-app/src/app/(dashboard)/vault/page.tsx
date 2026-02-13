"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useVaultFiles } from "@/hooks/useVaultFiles";
import DropZone from "@/components/vault/DropZone";
import FileTable from "@/components/vault/FileTable";
import FilePreview from "@/components/vault/FilePreview";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VaultPage() {
  const { user } = useAuth();
  const { files, loading, totalSize, uploadFile, deleteFile } = useVaultFiles(user?.id);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return files.filter((f) => f.filename.toLowerCase().includes(q));
  }, [files, search]);

  const selectedFileData = useMemo(
    () => files.find((f) => f.filename === selectedFile) || null,
    [files, selectedFile],
  );

  const handleDelete = async (filename: string) => {
    await deleteFile(filename);
    if (selectedFile === filename) {
      setSelectedFile(null);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-xl font-bold text-highlight">Vault</h1>
        {!loading && files.length > 0 && (
          <p className="text-xs text-text/40">
            {files.length} file{files.length !== 1 ? "s" : ""} — {formatSize(totalSize)}
          </p>
        )}
      </div>

      <div className="mb-6">
        <DropZone onUpload={uploadFile} disabled={loading} />
      </div>

      {files.length > 5 && (
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-full bg-background border border-primary/30 px-3 py-2 text-sm text-text placeholder:text-text/40 focus:outline-none focus:border-highlight transition-colors"
          />
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text/40 py-8 text-center">Loading...</p>
      ) : (
        <div className={`flex gap-6 ${selectedFileData ? "" : ""}`}>
          <div className={selectedFileData ? "flex-1 min-w-0" : "w-full"}>
            <FileTable
              files={filteredFiles}
              selectedFile={selectedFile}
              onSelect={setSelectedFile}
              onDelete={handleDelete}
            />
          </div>

          {selectedFileData && user && (
            <div className="w-[380px] shrink-0 max-h-[600px]">
              <FilePreview
                file={selectedFileData}
                userId={user.id}
                onClose={() => setSelectedFile(null)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
