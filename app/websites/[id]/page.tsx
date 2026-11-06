"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RefreshCw, Trash2 } from "lucide-react";
import { LanguageBadgeGroup } from "@/components/ui/LanguageBadge";
import { ScanStatusBadge } from "@/components/ui/Badge";
import { CategoryCard } from "@/components/scans/CategoryCard";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DeleteWebsiteModal } from "@/components/websites/DeleteWebsiteModal";
import { useIssuesForScan, useScansForWebsite, useWebsite } from "@/lib/store/hooks";
import { ISSUE_CATEGORIES, ISSUE_CATEGORY_CONFIG } from "@/lib/issue-categories";
import { formatRelativeTime, formatDateTime } from "@/lib/utils/format";
import { rescan } from "@/lib/api/scans";

export default function WebsiteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const website = useWebsite(params.id);
  const scans = useScansForWebsite(params.id);
  const latestScan = scans[0];
  const issues = useIssuesForScan(latestScan?.id);
  const openIssues = issues.filter((i) => i.status === "open");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [rescanning, setRescanning] = useState(false);

  if (!website) return notFound();

  async function handleRescan() {
    if (!latestScan) return;
    setRescanning(true);
    const result = await rescan(latestScan.id);
    setRescanning(false);
    if (result) router.push(`/scans/${result.scanId}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="break-all font-mono text-xl font-semibold text-text">{website.label}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <LanguageBadgeGroup languages={website.languages} />
            {latestScan && (
              <span className="text-sm text-text-secondary">
                Last scanned: <bdi suppressHydrationWarning>{formatDateTime(latestScan.startedAt)}</bdi>
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {latestScan ? (
            <Button variant="secondary" onClick={handleRescan} disabled={rescanning}>
              <RefreshCw size={14} className={rescanning ? "animate-spin" : ""} />
              {rescanning ? "Starting…" : "Rescan"}
            </Button>
          ) : (
            <Link href="/scans/new" className={buttonClasses("secondary", "md")}>
              <RefreshCw size={14} />
              Scan now
            </Link>
          )}
          <Button variant="secondary" onClick={() => setConfirmingDelete(true)} aria-label={`Remove ${website.label}`}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {!latestScan ? (
        <div className="mt-8">
          <EmptyState title="No scans yet" body="Run a scan to see translation, RTL, and SEO results for this website." />
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center gap-2">
            <ScanStatusBadge status={latestScan.status} />
            <span className="text-sm text-text-secondary">{openIssues.length} open issues</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {ISSUE_CATEGORIES.map((category) => (
              <CategoryCard
                key={category}
                category={category}
                count={openIssues.filter((i) => i.category === category).length}
                href={`/scans/${latestScan.id}/${ISSUE_CATEGORY_CONFIG[category].hrefSegment}`}
              />
            ))}
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold text-text">Scan history</h2>
            <Card className="divide-y divide-border overflow-hidden">
              {scans.map((scan) => (
                <Link
                  key={scan.id}
                  href={`/scans/${scan.id}/results`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-surface-hover"
                >
                  <span className="text-text-secondary">
                    <bdi suppressHydrationWarning>{formatRelativeTime(scan.startedAt)}</bdi>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-text-muted">
                      {scan.detectedLanguages.length} {scan.detectedLanguages.length === 1 ? "language" : "languages"}
                    </span>
                    <span className="font-medium text-text">{scan.issueCount} issues</span>
                    <ScanStatusBadge status={scan.status} />
                  </div>
                </Link>
              ))}
            </Card>
          </div>
        </>
      )}

      <DeleteWebsiteModal
        website={confirmingDelete ? website : undefined}
        onClose={() => setConfirmingDelete(false)}
        onDeleted={() => router.push("/websites")}
      />
    </div>
  );
}
