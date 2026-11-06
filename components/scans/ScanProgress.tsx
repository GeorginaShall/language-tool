"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";
import { useScan, useWebsite } from "@/lib/store/hooks";
import { rescanInPlace } from "@/lib/api/scans";

export function ScanProgress({ scanId }: { scanId: string }) {
  const router = useRouter();
  const scan = useScan(scanId);
  const website = useWebsite(scan?.websiteId);

  useEffect(() => {
    if (scan?.status === "completed") {
      const timeout = setTimeout(() => router.push(`/scans/${scanId}/results`), 700);
      return () => clearTimeout(timeout);
    }
  }, [scan?.status, scanId, router]);

  if (!scan || !website) {
    return <p className="px-4 py-10 text-center text-sm text-text-secondary">Preparing scan…</p>;
  }

  if (scan.status === "failed") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="break-all font-mono text-lg font-semibold text-text">Couldn&apos;t scan {website.label}</h1>
        <Card className="mt-4 flex items-start gap-3 p-4">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-error" />
          <div>
            <p className="text-sm text-text">{scan.errorMessage ?? "This page could not be scanned."}</p>
            <p className="mt-2 text-sm text-text-secondary">
              The page is fetched live, so this can happen if the site blocks automated requests, renders its
              content entirely with client-side JavaScript, or is unreachable from here.
            </p>
          </div>
        </Card>
        <div className="mt-4 flex gap-2">
          <Button variant="primary" onClick={() => void rescanInPlace(scanId)}>
            <RefreshCw size={14} />
            Retry
          </Button>
          <Link href="/scans/new" className={buttonClasses("secondary")}>
            Try another scan
          </Link>
          <Link href="/websites" className={buttonClasses("secondary")}>
            Back to scanned pages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="break-all font-mono text-lg font-semibold text-text">
        {scan.status === "completed" ? "Scan complete — " : "Scanning "}
        {website.label}
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        {scan.status === "completed"
          ? `Found ${Math.max(scan.detectedLanguages.length - 1, 0)} other language ${scan.detectedLanguages.length === 2 ? "version" : "versions"} and compared ${scan.translationsChecked} pieces of content.`
          : "Reading the page and every language version it links to — this can take a little while."}
      </p>

      <Card className="mt-4 p-4">
        <div className="flex items-center gap-2.5">
          {scan.status === "completed" ? (
            <div className="h-4 w-4 shrink-0 rounded-full bg-success" />
          ) : (
            <Loader2 size={16} className="shrink-0 animate-spin text-info" />
          )}
          <span className="text-sm text-text">
            {scan.status === "completed" ? "Done" : (scan.statusMessage ?? "Working…")}
          </span>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Languages detected" value={scan.detectedLanguages.length} />
        <Stat
          label="Versions analyzed"
          value={scan.detectedLanguages.filter((l) => l.status === "analyzed" || l.status === "selected").length}
        />
        <Stat label="Content checked" value={scan.translationsChecked} />
        <Stat label="Issues found" value={scan.issueCount} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-3.5">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-text">{value}</p>
    </Card>
  );
}
