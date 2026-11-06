"use client";

import Link from "next/link";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { LanguageBadgeGroup } from "@/components/ui/LanguageBadge";
import { ScanStatusBadge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Scan, Website } from "@/types";

export function WebsiteCard({
  website,
  latestScan,
  onDeleteClick,
}: {
  website: Website;
  latestScan?: Scan;
  onDeleteClick?: (website: Website) => void;
}) {
  return (
    <Link href={`/websites/${website.id}`}>
      <Card className="group h-full p-4 transition-colors hover:border-accent">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-mono text-sm font-medium text-text">{website.label}</p>
          <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            {onDeleteClick && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeleteClick(website);
                }}
                aria-label={`Remove ${website.label}`}
                className="rounded p-1 text-text-muted hover:bg-error-bg hover:text-error"
              >
                <Trash2 size={14} />
              </button>
            )}
            <ArrowUpRight size={15} className="text-text-muted" />
          </div>
        </div>
        <div className="mt-2">
          <LanguageBadgeGroup languages={website.languages} />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="text-text-muted">
            {latestScan ? (
              <>
                Scanned <bdi suppressHydrationWarning>{formatRelativeTime(latestScan.startedAt)}</bdi>
              </>
            ) : (
              "Not scanned yet"
            )}
          </span>
          {latestScan && (
            <div className="flex items-center gap-2">
              <span className="font-medium text-text">{latestScan.issueCount} issues</span>
              <ScanStatusBadge status={latestScan.status} />
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
