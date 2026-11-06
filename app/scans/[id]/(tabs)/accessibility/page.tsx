"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { IssueListCard } from "@/components/issues/IssueListCard";
import { IssueDrawer } from "@/components/issues/IssueDrawer";
import { useIssuesForScan } from "@/lib/store/hooks";
import type { Issue } from "@/types";

export default function AccessibilityAuditPage() {
  const params = useParams<{ id: string }>();
  const issues = useIssuesForScan(params.id).filter((i) => i.category === "accessibility" && i.status === "open");
  const [selected, setSelected] = useState<Issue | undefined>(undefined);

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-text">Accessibility issues</h2>
      <IssueListCard
        issues={issues}
        onSelect={setSelected}
        emptyTitle="No accessibility issues found"
        emptyBody="Forms, labels, and alt text look correctly localized."
      />
      <IssueDrawer issue={selected} onClose={() => setSelected(undefined)} />
    </div>
  );
}
