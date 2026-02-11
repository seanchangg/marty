"use client";

interface DiffViewProps {
  oldText: string;
  newText: string;
}

export default function DiffView({ oldText, newText }: DiffViewProps) {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  // Simple line-by-line diff
  const maxLen = Math.max(oldLines.length, newLines.length);
  const diffLines: { type: "same" | "removed" | "added"; text: string }[] = [];

  // Find removed lines (in old but not in new at the same position)
  // and added lines (in new but not in old)
  let oi = 0;
  let ni = 0;

  while (oi < oldLines.length || ni < newLines.length) {
    const oldLine = oi < oldLines.length ? oldLines[oi] : undefined;
    const newLine = ni < newLines.length ? newLines[ni] : undefined;

    if (oldLine === newLine) {
      diffLines.push({ type: "same", text: oldLine ?? "" });
      oi++;
      ni++;
    } else if (
      oldLine !== undefined &&
      !newLines.slice(ni).includes(oldLine)
    ) {
      diffLines.push({ type: "removed", text: oldLine });
      oi++;
    } else if (
      newLine !== undefined &&
      !oldLines.slice(oi).includes(newLine)
    ) {
      diffLines.push({ type: "added", text: newLine });
      ni++;
    } else {
      // Lines differ but both exist further — treat old as removed, new as added
      if (oldLine !== undefined) {
        diffLines.push({ type: "removed", text: oldLine });
        oi++;
      }
      if (newLine !== undefined) {
        diffLines.push({ type: "added", text: newLine });
        ni++;
      }
    }

    // Safety: prevent infinite loops
    if (diffLines.length > maxLen * 3) break;
  }

  return (
    <div className="font-mono text-xs overflow-x-auto">
      {diffLines.map((line, i) => (
        <div
          key={i}
          className={
            line.type === "removed"
              ? "bg-danger/15 text-danger"
              : line.type === "added"
                ? "bg-highlight/10 text-highlight"
                : "text-text/50"
          }
        >
          <span className="inline-block w-5 text-right mr-2 select-none opacity-50">
            {line.type === "removed" ? "-" : line.type === "added" ? "+" : " "}
          </span>
          {line.text}
        </div>
      ))}
    </div>
  );
}
