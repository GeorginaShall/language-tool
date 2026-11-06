"use client";

import Link from "next/link";
import { Globe, Languages, PlusCircle, ScanSearch, FlipHorizontal2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { RecentScansTable } from "@/components/dashboard/RecentScansTable";
import { buttonClasses } from "@/components/ui/Button";
import { useAllIssues, useAllScans, useWebsites } from "@/lib/store/hooks";
import { useLocale } from "@/context/LocaleContext";

export default function DashboardPage() {
  const { t } = useLocale();
  const websites = useWebsites();
  const scans = useAllScans();
  const issues = useAllIssues();

  const latestScanPerWebsite = websites
    .map((website) => ({
      website,
      scan: scans.find((s) => s.websiteId === website.id),
    }))
    .filter((row): row is { website: (typeof websites)[number]; scan: NonNullable<(typeof row)["scan"]> } => Boolean(row.scan))
    .sort((a, b) => new Date(b.scan.startedAt).getTime() - new Date(a.scan.startedAt).getTime());

  // Only each page's most recent scan counts — older scans of the same URL are superseded.
  const latestScanIds = new Set(latestScanPerWebsite.map((row) => row.scan.id));
  const openIssues = issues.filter((i) => i.status === "open" && latestScanIds.has(i.scanId));
  const translationIssues = openIssues.filter((i) => i.category === "translation").length;
  const rtlIssues = openIssues.filter((i) => i.category === "rtl").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">{t("dashboard.title")}</h1>
          <p className="mt-1 max-w-xl text-sm text-text-secondary">{t("dashboard.subtitle")}</p>
        </div>
        <Link href="/scans/new" className={buttonClasses("primary", "md", "shrink-0")}>
          <PlusCircle size={15} />
          {t("action.newScan")}
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.websites")} value={websites.length} icon={Globe} />
        <StatCard label={t("dashboard.totalScans")} value={scans.length} icon={ScanSearch} />
        <StatCard label={t("dashboard.translationIssues")} value={translationIssues} icon={Languages} tone="warning" />
        <StatCard label={t("dashboard.rtlIssues")} value={rtlIssues} icon={FlipHorizontal2} tone="error" />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-text">{t("dashboard.recentScans")}</h2>
        <RecentScansTable rows={latestScanPerWebsite} />
      </div>
    </div>
  );
}
