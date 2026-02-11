"use client";

import ProposedActionCard from "./ProposedActionCard";
import Button from "@/components/ui/Button";
import type { ProposedAction } from "@/types";

interface ProposedActionsListProps {
  proposals: ProposedAction[];
  onApprove: (id: string, editedInput?: Record<string, string>) => void;
  onDeny: (id: string) => void;
}

export default function ProposedActionsList({
  proposals,
  onApprove,
  onDeny,
}: ProposedActionsListProps) {
  if (proposals.length === 0) return null;

  const pending = proposals.filter((p) => p.status === "pending");
  const completed = proposals.filter((p) => p.status !== "pending");

  const handleApproveAll = () => {
    pending.forEach((p) => onApprove(p.id));
  };

  const handleDenyAll = () => {
    pending.forEach((p) => onDeny(p.id));
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Batch controls when multiple pending */}
      {pending.length > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-text/50">
            {pending.length} pending approval{pending.length > 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={handleApproveAll}
              className="text-xs px-2 py-1"
            >
              Approve All
            </Button>
            <Button
              variant="secondary"
              onClick={handleDenyAll}
              className="text-xs px-2 py-1"
            >
              Deny All
            </Button>
          </div>
        </div>
      )}

      {/* Pending proposals first */}
      {pending.map((action) => (
        <ProposedActionCard
          key={action.id}
          action={action}
          onApprove={onApprove}
          onDeny={onDeny}
        />
      ))}

      {/* Completed/denied proposals */}
      {completed.map((action) => (
        <ProposedActionCard
          key={action.id}
          action={action}
          onApprove={onApprove}
          onDeny={onDeny}
        />
      ))}
    </div>
  );
}
