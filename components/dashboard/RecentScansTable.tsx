"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { LanguageBadgeGroup } from "@/components/ui/LanguageBadge";
import { ScanStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils/format";
import type { Scan, Website } from "@/types";

interface Row {
  website: Website;
  scan: Scan;
}

export function RecentScansTable({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return <EmptyState title="No scans yet" body="Run your first scan to see results here." />;
  }

  return (
    <Card className="overflow-hidden">
      {/* Mobile: stacked cards */}
      <div className="divide-y divide-border md:hidden">
        {rows.map(({ website, scan }) => (
          <Link
            key={scan.id}
            href={`/websites/${website.id}`}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-hover"
          >
            <div className="min-w-0">
              <p className="truncate font-mono text-sm text-text">{website.label}</p>
              <div className="mt-1 flex items-center gap-2">
                <LanguageBadgeGroup languages={website.languages} />
                <span className="text-xs text-text-muted">
                  <bdi suppressHydrationWarning>{formatRelativeTime(scan.startedAt)}</bdi>
                </span>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm font-medium text-text">{scan.issueCount}</span>
              <ChevronRight size={14} className="text-text-muted" />
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[640px] text-start text-sm">
        <thead>
          <tr className="border-b border-border text-start text-xs font-medium uppercase tracking-wide text-text-muted">
            <th className="px-4 py-2.5 text-start font-medium">Website</th>
            <th className="px-4 py-2.5 text-start font-medium">Languages</th>
            <th className="px-4 py-2.5 text-start font-medium">Last Scan</th>
            <th className="px-4 py-2.5 text-start font-medium">Issues</th>
            <th className="px-4 py-2.5 text-start font-medium">Status</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(({ website, scan }) => (
            <tr key={scan.id} className="group cursor-pointer hover:bg-surface-hover">
              <td className="px-4 py-3 font-mono text-text">
                <Link href={`/websites/${website.id}`} className="hover:underline">
                  {website.label}
                </Link>
              </td>
              <td className="px-4 py-3">
                <LanguageBadgeGroup languages={website.languages} />
              </td>
              <td className="px-4 py-3 text-text-secondary">
                <bdi suppressHydrationWarning>{formatRelativeTime(scan.startedAt)}</bdi>
              </td>
              <td className="px-4 py-3 font-medium text-text">{scan.issueCount}</td>
              <td className="px-4 py-3">
                <ScanStatusBadge status={scan.status} />
              </td>
              <td className="px-4 py-3 text-end">
                <Link href={`/websites/${website.id}`} aria-label={`Open ${website.label}`}>
                  <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </Card>
  );
}
