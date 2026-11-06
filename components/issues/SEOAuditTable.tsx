"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IssueDrawer } from "@/components/issues/IssueDrawer";
import { IssueListCard } from "@/components/issues/IssueListCard";
import type { HreflangEntry, Issue } from "@/types";

function CheckIcon({ ok }: { ok: boolean }) {
  return ok ? <Check size={15} className="text-success" /> : <X size={15} className="text-error" />;
}

export function SEOAuditTable({ entries, issues }: { entries: HreflangEntry[]; issues: Issue[] }) {
  const [selected, setSelected] = useState<Issue | undefined>(undefined);
  const openIssues = issues.filter((i) => i.status === "open");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">hreflang &amp; metadata</h2>
        <Card className="overflow-hidden">
          {/* Mobile cards */}
          <div className="divide-y divide-border md:hidden">
            {entries.map((entry) => (
              <div key={entry.path} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-text">{entry.path}</span>
                  <span className="font-mono text-xs uppercase text-text-muted">{entry.lang}</span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <CheckIcon ok={entry.hreflangOk} /> hreflang
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckIcon ok={entry.canonicalOk} /> canonical
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckIcon ok={entry.metaTitleOk} /> title
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <table className="hidden w-full text-start text-sm md:table">
            <thead>
              <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-text-muted">
                <th className="px-4 py-2.5 text-start font-medium">URL</th>
                <th className="px-4 py-2.5 text-start font-medium">lang</th>
                <th className="px-4 py-2.5 text-start font-medium">hreflang</th>
                <th className="px-4 py-2.5 text-start font-medium">canonical</th>
                <th className="px-4 py-2.5 text-start font-medium">Meta title</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry) => (
                <tr key={entry.path}>
                  <td className="px-4 py-3 font-mono text-text">{entry.path}</td>
                  <td className="px-4 py-3 font-mono uppercase text-text-secondary">{entry.lang}</td>
                  <td className="px-4 py-3"><CheckIcon ok={entry.hreflangOk} /></td>
                  <td className="px-4 py-3"><CheckIcon ok={entry.canonicalOk} /></td>
                  <td className="px-4 py-3"><CheckIcon ok={entry.metaTitleOk} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">SEO issues</h2>
        <IssueListCard issues={openIssues} onSelect={setSelected} emptyTitle="No SEO issues found" emptyBody="Nothing matches the current filters." />
      </div>

      <IssueDrawer issue={selected} onClose={() => setSelected(undefined)} />
    </div>
  );
}
