"use client";

import { useState } from "react";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import {
  ArrowLeftRight,
  Type,
  MoveHorizontal,
  LayoutGrid,
  MousePointerClick,
  Image as ImageIcon,
  FormInput,
  Navigation,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/ui/Badge";
import { CodeSuggestion } from "@/components/ui/CodeSuggestion";
import { IssueDrawer } from "@/components/issues/IssueDrawer";
import type { Issue, RtlAspect } from "@/types";

const ASPECTS: { key: RtlAspect; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; goodMessage: string }[] = [
  { key: "direction", label: "Direction", icon: ArrowLeftRight, goodMessage: 'html[dir="rtl"] detected' },
  { key: "typography", label: "Typography", icon: Type, goodMessage: "Text alignment uses logical values" },
  { key: "spacing", label: "Spacing", icon: MoveHorizontal, goodMessage: "No obvious directional spacing issues" },
  { key: "layout", label: "Layout", icon: LayoutGrid, goodMessage: "No hardcoded directional positioning found" },
  { key: "icons", label: "Icons", icon: MousePointerClick, goodMessage: "Directional icons mirror correctly" },
  { key: "images", label: "Images", icon: ImageIcon, goodMessage: "No directional image issues found" },
  { key: "forms", label: "Forms", icon: FormInput, goodMessage: "Form fields mirror correctly under RTL" },
  { key: "navigation", label: "Navigation", icon: Navigation, goodMessage: "Navigation order matches reading direction" },
];

export function RTLAuditPanel({ issues }: { issues: Issue[] }) {
  const [selected, setSelected] = useState<Issue | undefined>(undefined);
  const openIssues = issues.filter((i) => i.status === "open");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">RTL checklist</h2>
        <Card className="divide-y divide-border overflow-hidden">
          {ASPECTS.map((aspect) => {
            const aspectIssues = openIssues.filter((i) => i.rtlAspect === aspect.key);
            const Icon = aspect.icon;
            return (
              <div key={aspect.key} className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className="text-text-muted" />
                  <span className="text-sm font-medium text-text">{aspect.label}</span>
                  {aspectIssues.length === 0 ? (
                    <span className="ms-auto inline-flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 size={13} />
                      {aspect.goodMessage}
                    </span>
                  ) : (
                    <span className="ms-auto text-xs text-text-muted">
                      {aspectIssues.length} {aspectIssues.length === 1 ? "issue" : "issues"}
                    </span>
                  )}
                </div>
                {aspectIssues.map((issue) => (
                  <button
                    key={issue.id}
                    onClick={() => setSelected(issue)}
                    className="mt-2 flex w-full items-start gap-2 rounded-md bg-warning-bg/60 px-2.5 py-2 text-start hover:bg-warning-bg"
                  >
                    <TriangleAlert size={14} className="mt-0.5 shrink-0 text-warning" />
                    <span className="text-sm text-text">{issue.message}</span>
                    <SeverityBadge severity={issue.severity} className="ms-auto shrink-0" />
                  </button>
                ))}
              </div>
            );
          })}
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-text">Suggested fixes</h2>
        <div className="space-y-3">
          {openIssues
            .filter((i) => i.cssCurrent || i.cssSuggested)
            .map((issue) => (
              <Card key={issue.id} className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-text-muted">{issue.page}</p>
                    <p className="mt-0.5 text-sm text-text">{issue.message}</p>
                  </div>
                  <SeverityBadge severity={issue.severity} className="shrink-0" />
                </div>
                <CodeSuggestion current={issue.cssCurrent ?? ""} suggested={issue.cssSuggested ?? ""} />
              </Card>
            ))}
        </div>
      </div>

      <IssueDrawer issue={selected} onClose={() => setSelected(undefined)} />
    </div>
  );
}
