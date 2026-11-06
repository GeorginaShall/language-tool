"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { FilterBar } from "@/components/ui/FilterBar";
import { TranslationIssueTable } from "@/components/issues/TranslationIssueTable";
import { IssueDrawer } from "@/components/issues/IssueDrawer";
import { UntranslatedContentList } from "@/components/issues/UntranslatedContentList";
import { useIssueFilters } from "@/components/issues/useIssueFilters";
import { useIssuesForScan } from "@/lib/store/hooks";
import type { Issue } from "@/types";

export default function TranslationIssuesPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const allIssues = useIssuesForScan(params.id).filter((i) => i.category === "translation");
  const { filtered, filters, search, setSearch } = useIssueFilters(allIssues);
  const [selected, setSelected] = useState<Issue | undefined>(undefined);

  useEffect(() => {
    const issueId = searchParams.get("issue");
    if (issueId) {
      const found = allIssues.find((i) => i.id === issueId);
      // Opens the drawer for a deep-linked issue (e.g. from the command palette).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (found) setSelected(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openIssues = allIssues.filter((i) => i.status === "open");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">Translation issues</h2>
        <div className="overflow-hidden rounded-[10px] border border-border">
          <FilterBar filters={filters} search={{ value: search, onChange: setSearch, placeholder: "Search issues…" }} />
          <TranslationIssueTable issues={filtered} onSelect={setSelected} />
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-sm font-semibold text-text">Potentially untranslated content</h2>
        <p className="mb-3 text-sm text-text-secondary">
          Text that appears unchanged between languages. Some terms may legitimately stay the same.
        </p>
        <UntranslatedContentList issues={openIssues} />
      </div>

      <IssueDrawer issue={selected} onClose={() => setSelected(undefined)} />
    </div>
  );
}
