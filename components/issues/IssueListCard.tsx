"use client";

import { TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Issue } from "@/types";

export function IssueListCard({
  issues,
  onSelect,
  emptyTitle,
  emptyBody,
}: {
  issues: Issue[];
  onSelect: (issue: Issue) => void;
  emptyTitle: string;
  emptyBody?: string;
}) {
  if (issues.length === 0) {
    return <EmptyState title={emptyTitle} body={emptyBody} />;
  }

  return (
    <Card className="divide-y divide-border overflow-hidden">
      {issues.map((issue) => (
        <button
          key={issue.id}
          onClick={() => onSelect(issue)}
          className="flex w-full items-start gap-3 px-4 py-3 text-start hover:bg-surface-hover"
        >
          <TriangleAlert size={15} className="mt-0.5 shrink-0 text-warning" />
          <div className="min-w-0">
            <p className="font-mono text-xs text-text-muted">{issue.page}</p>
            <p className="mt-0.5 text-sm text-text">{issue.message}</p>
          </div>
          <SeverityBadge severity={issue.severity} className="ms-auto shrink-0" />
        </button>
      ))}
    </Card>
  );
}
