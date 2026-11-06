"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { LanguageComparison } from "@/components/issues/LanguageComparison";
import { Card } from "@/components/ui/Card";
import { IssueStatusBadge, SeverityBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LanguageBadge } from "@/components/ui/LanguageBadge";
import { useComparison, useIssuesForScan, usePagesForScan } from "@/lib/store/hooks";
import { getLanguage } from "@/lib/languages";

function statusTone(status: "good" | "warning" | "critical") {
  if (status === "good") return "text-success";
  if (status === "warning") return "text-warning";
  return "text-error";
}

export default function LanguageVersionDetailPage() {
  const params = useParams<{ id: string; pageId: string }>();
  const pages = usePagesForScan(params.id);
  const issues = useIssuesForScan(params.id);

  const page = pages.find((p) => p.id === params.pageId);
  const selected = pages.find((p) => p.isSelected);
  const pairs = useComparison(params.id, page?.languageCode);

  if (!page) return notFound();

  const language = getLanguage(page.languageCode);
  const pageIssues = issues.filter((i) => i.page === page.path);
  const others = pages.filter((p) => !p.isSelected);

  return (
    <div className="space-y-6">
      <Card className="grid grid-cols-2 gap-x-6 gap-y-4 p-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-text-muted">Language</p>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-text">
            <LanguageBadge language={language} showDirection />
            {language.name}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-text-muted">URL</p>
          <a
            href={page.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex max-w-full items-center gap-1 font-mono text-sm text-accent hover:underline"
          >
            <span className="truncate">{page.url}</span>
            <ExternalLink size={12} className="shrink-0" />
          </a>
        </div>
        <Info label="Translation" value={page.isSelected ? "Source" : `${page.translationStatus}%`} />
        <Info label="RTL status" value={page.rtlStatus} valueClassName={statusTone(page.rtlStatus)} capitalize />
        <Info label="SEO" value={page.seoStatus} valueClassName={statusTone(page.seoStatus)} capitalize />
        <Info label="Issues" value={String(page.issueCount)} />
      </Card>

      {pageIssues.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-text">Issues on this version</h2>
          <Card className="divide-y divide-border overflow-hidden">
            {pageIssues.map((issue) => (
              <div key={issue.id} className="flex items-center gap-3 px-4 py-3">
                <p className="min-w-0 flex-1 truncate text-sm text-text" title={issue.message}>
                  {issue.message}
                </p>
                <SeverityBadge severity={issue.severity} />
                <IssueStatusBadge status={issue.status} />
              </div>
            ))}
          </Card>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">Language comparison</h2>
        {page.isSelected || !selected ? (
          <EmptyState
            title="This is the page you selected"
            body={
              others.length > 0
                ? "Open another language version to compare it with this page."
                : "No other language versions were analyzed, so there is nothing to compare."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {others.map((o) => (
                  <Link
                    key={o.id}
                    href={`/scans/${params.id}/pages/${o.id}`}
                    className="rounded-md border border-border px-3 py-1.5 text-sm text-text hover:bg-surface-hover"
                  >
                    Compare with {getLanguage(o.languageCode).name}
                  </Link>
                ))}
              </div>
            }
          />
        ) : pairs.length === 0 ? (
          <EmptyState title="No comparable content" body="Nothing could be extracted from these pages to compare." />
        ) : (
          <LanguageComparison pairs={pairs} sourceLang={getLanguage(selected.languageCode)} targetLang={language} />
        )}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
  valueClassName,
  capitalize,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  capitalize?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-0.5 text-sm text-text ${capitalize ? "capitalize" : ""} ${valueClassName ?? ""}`}>{value}</p>
    </div>
  );
}
