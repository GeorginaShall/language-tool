"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LanguageBadgeGroup } from "@/components/ui/LanguageBadge";
import { ScanTabs } from "@/components/scans/ScanTabs";
import { useScan, useWebsite } from "@/lib/store/hooks";
import { useActiveScan } from "@/context/ActiveScanContext";
import { isCatalogCode } from "@/lib/languages";
import { formatDate } from "@/lib/utils/format";
import { rescanInPlace } from "@/lib/api/scans";

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const scan = useScan(params.id);
  const website = useWebsite(scan?.websiteId);
  const { setActiveScanId } = useActiveScan();

  // Whatever scan is currently open becomes the "active" one, so sidebar
  // links (Translation Issues, RTL Audit, ...) follow it instead of staying
  // pinned to whichever site was active before — without this, running a
  // new scan and then clicking the sidebar silently jumps back to the
  // previous site's results.
  const scanId = scan?.id;
  useEffect(() => {
    if (scanId) setActiveScanId(scanId);
  }, [scanId, setActiveScanId]);

  if (!scan || !website) {
    return <div className="px-4 py-10 text-center text-sm text-text-secondary">Loading scan…</div>;
  }

  async function handleRescan() {
    if (scanId && (await rescanInPlace(scanId))) router.push(`/scans/${scanId}`);
  }

  return (
    <div>
      <div className="border-b border-border px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="break-all font-mono text-lg font-semibold text-text">
                <a href={scan.pageUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {website.label}
                </a>
              </h1>
              <div className="mt-1.5 flex items-center gap-2">
                <LanguageBadgeGroup
                  languages={
                    scan.detectedLanguages.length > 0
                      ? scan.detectedLanguages.map((l) => l.code).filter(isCatalogCode)
                      : [scan.language]
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-end text-sm text-text-secondary">
                <p className="text-xs text-text-muted">Last scanned</p>
                <p><bdi suppressHydrationWarning>{formatDate(scan.startedAt)}</bdi></p>
              </div>
              <Button variant="secondary" onClick={handleRescan} disabled={scan.status === "scanning"}>
                <RefreshCw size={14} className={scan.status === "scanning" ? "animate-spin" : ""} />
                {scan.status === "scanning" ? "Scanning…" : "Rescan"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <ScanTabs scanId={scan.id} />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
