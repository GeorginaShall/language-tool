"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import { getLanguage } from "@/lib/languages";
import { cn } from "@/lib/utils/cn";
import type { PageRecord } from "@/types";

const STATUS_TONE: Record<PageRecord["rtlStatus"], string> = {
  good: "text-success",
  warning: "text-warning",
  critical: "text-error",
};

export function LanguageVersionsList({ scanId, pages }: { scanId: string; pages: PageRecord[] }) {
  if (pages.length === 0) {
    return <EmptyState title="No language versions" body="No page versions were analyzed in this scan." />;
  }

  const sorted = [...pages].sort((a, b) => Number(b.isSelected) - Number(a.isSelected));

  return (
    <Card className="divide-y divide-border overflow-hidden">
      {sorted.map((page) => {
        const language = getLanguage(page.languageCode);
        return (
          <Link
            key={page.id}
            href={`/scans/${scanId}/pages/${page.id}`}
            className="group flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 hover:bg-surface-hover"
          >
            <div className="flex w-40 shrink-0 items-center gap-2">
              <LanguageBadge language={language} />
              <span className="text-sm font-medium text-text">{language.name}</span>
              {page.isSelected && (
                <span className="rounded-md bg-info-bg px-1.5 py-0.5 text-[11px] font-medium text-info">Selected</span>
              )}
            </div>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary" title={page.url}>
              {page.path}
            </span>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-text-secondary">
                Translation <span className="font-mono text-text">{page.translationStatus}%</span>
              </span>
              <span className="text-text-secondary">
                RTL <span className={cn("capitalize", STATUS_TONE[page.rtlStatus])}>{page.rtlStatus}</span>
              </span>
              <span className="text-text-secondary">
                SEO <span className={cn("capitalize", STATUS_TONE[page.seoStatus])}>{page.seoStatus}</span>
              </span>
              <span className="font-medium text-text">
                {page.issueCount} {page.issueCount === 1 ? "issue" : "issues"}
              </span>
            </div>
            <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100" />
          </Link>
        );
      })}
    </Card>
  );
}
