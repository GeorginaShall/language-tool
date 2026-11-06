"use client";

import { useState } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IssueDrawer } from "@/components/issues/IssueDrawer";
import { IssueListCard } from "@/components/issues/IssueListCard";
import type { Issue, Language, RouteMapping } from "@/types";

export function RoutingAuditPanel({
  mappings,
  languages,
  issues,
}: {
  mappings: RouteMapping[];
  languages: Language[];
  issues: Issue[];
}) {
  const [selected, setSelected] = useState<Issue | undefined>(undefined);
  const openIssues = issues.filter((i) => i.status === "open");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">Route structure</h2>
        <Card className="overflow-hidden">
          <table className="w-full text-start text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-text-muted">
                <th className="px-4 py-2.5 text-start font-medium">Page</th>
                {languages.map((lang) => (
                  <th key={lang.code} className="px-4 py-2.5 text-start font-medium">
                    {lang.name}
                  </th>
                ))}
                <th className="px-4 py-2.5 text-start font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mappings.map((mapping) => (
                <tr key={mapping.segment}>
                  <td className="px-4 py-3 font-medium text-text">{mapping.segment}</td>
                  {languages.map((lang) => (
                    <td key={lang.code} className="px-4 py-3 font-mono text-xs text-text-secondary">
                      {mapping.routes[lang.code] ?? <span className="text-text-muted">—</span>}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    {mapping.matching ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success">
                        <Check size={13} /> Matching
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-warning">
                        <TriangleAlert size={13} /> Different route
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">Routing issues</h2>
        <IssueListCard
          issues={openIssues}
          onSelect={setSelected}
          emptyTitle="No routing issues found"
          emptyBody="Language switcher links and URL structure look consistent."
        />
      </div>

      <IssueDrawer issue={selected} onClose={() => setSelected(undefined)} />
    </div>
  );
}
