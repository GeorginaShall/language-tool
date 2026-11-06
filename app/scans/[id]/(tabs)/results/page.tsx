"use client";

import { useParams } from "next/navigation";
import { CategoryCard } from "@/components/scans/CategoryCard";
import { DetectedLanguages } from "@/components/scans/DetectedLanguages";
import { useIssuesForScan, useScan } from "@/lib/store/hooks";
import { ISSUE_CATEGORIES, ISSUE_CATEGORY_CONFIG } from "@/lib/issue-categories";

export default function ScanResultsPage() {
  const params = useParams<{ id: string }>();
  const scan = useScan(params.id);
  const issues = useIssuesForScan(params.id).filter((i) => i.status === "open");

  return (
    <div className="space-y-8">
      {scan && <DetectedLanguages scan={scan} />}

      <div>
        <h2 className="mb-1 text-sm font-semibold text-text">Issue categories</h2>
        <p className="mb-4 text-sm text-text-secondary">Open a category to review issues and suggested fixes.</p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {ISSUE_CATEGORIES.map((category) => (
            <CategoryCard
              key={category}
              category={category}
              count={issues.filter((i) => i.category === category).length}
              href={`/scans/${params.id}/${ISSUE_CATEGORY_CONFIG[category].hrefSegment}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
