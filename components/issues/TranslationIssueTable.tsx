"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SeverityBadge, IssueStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { VisibilityBadge, localePath, locationLabel } from "@/components/issues/IssueLocation";
import { cn } from "@/lib/utils/cn";
import type { ElementType, Issue, IssueSeverity } from "@/types";

const TRANSLATION_TYPE_LABEL: Record<NonNullable<Issue["translationType"]>, string> = {
  "missing-translation": "Missing translation",
  "untranslated-text": "Untranslated text",
  "identical-translation": "Identical translation",
  "inconsistent-translation": "Inconsistent translation",
  "missing-page": "Missing page",
  "missing-metadata": "Missing metadata",
};

// ───────────────────────────── grouping by element ─────────────────────────────

type GroupKey =
  | "button"
  | "label"
  | "heading"
  | "paragraph"
  | "link"
  | "nav-item"
  | "placeholder"
  | "alt-text"
  | "metadata"
  | "other";

const GROUPS: { key: GroupKey; label: string; hint: string }[] = [
  { key: "button", label: "Buttons", hint: "Buttons, CTAs and submit controls" },
  { key: "label", label: "Labels", hint: "Badges, form labels and aria-labels" },
  { key: "heading", label: "Headings", hint: "h1–h6 and section titles" },
  { key: "paragraph", label: "Paragraphs", hint: "Body copy, announcement bar and short text" },
  { key: "link", label: "Links", hint: "Footer and in-content links" },
  { key: "nav-item", label: "Navigation", hint: "Header and menu links" },
  { key: "placeholder", label: "Placeholders", hint: "Form field placeholders" },
  { key: "alt-text", label: "Image alt text", hint: "Alternative text on images" },
  { key: "metadata", label: "Metadata", hint: "Title, meta description and Open Graph tags" },
  { key: "other", label: "Page-level & widgets", hint: "Whole-page checks and third-party apps" },
];

const ELEMENT_GROUP: Record<ElementType, GroupKey> = {
  button: "button",
  label: "label",
  heading: "heading",
  paragraph: "paragraph",
  link: "link",
  "nav-item": "nav-item",
  placeholder: "placeholder",
  "alt-text": "alt-text",
  "meta-title": "metadata",
  "meta-description": "metadata",
  "og-tag": "metadata",
};

const SEVERITY_ORDER: IssueSeverity[] = ["critical", "warning", "info"];

const SEVERITY_DOT: Record<IssueSeverity, string> = {
  critical: "bg-error",
  warning: "bg-warning",
  info: "bg-info",
};

function groupIssues(issues: Issue[]) {
  const byKey = new Map<GroupKey, Issue[]>();
  for (const issue of issues) {
    const key = issue.element ? ELEMENT_GROUP[issue.element] : "other";
    const list = byKey.get(key) ?? [];
    list.push(issue);
    byKey.set(key, list);
  }
  return GROUPS.filter((g) => byKey.has(g.key)).map((g) => {
    const items = byKey
      .get(g.key)!
      .slice()
      .sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
    const counts = SEVERITY_ORDER.map((s) => ({ severity: s, count: items.filter((i) => i.severity === s).length })).filter(
      (c) => c.count > 0
    );
    return { ...g, items, counts };
  });
}

// ───────────────────────────── small pieces ─────────────────────────────

function PagePath({ issue }: { issue: Issue }) {
  const { lang, path } = localePath(issue.url, issue.page);
  const shownLang = lang ?? issue.targetLanguage;
  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
      {shownLang && (
        <span className="shrink-0 rounded border border-border px-1 font-mono text-[10px] uppercase text-text-muted">{shownLang}</span>
      )}
      <span className="truncate font-mono text-xs">{path}</span>
    </span>
  );
}

function Dash() {
  return <span className="text-text-muted">—</span>;
}

function SeverityCounts({ counts }: { counts: { severity: IssueSeverity; count: number }[] }) {
  return (
    <span className="flex items-center gap-2.5">
      {counts.map((c) => (
        <span key={c.severity} className="inline-flex items-center gap-1 text-xs text-text-secondary" title={`${c.count} ${c.severity}`}>
          <span className={cn("h-1.5 w-1.5 rounded-full", SEVERITY_DOT[c.severity])} />
          {c.count}
        </span>
      ))}
    </span>
  );
}

function GroupHeaderContent({
  label,
  hint,
  total,
  counts,
  open,
}: {
  label: string;
  hint: string;
  total: number;
  counts: { severity: IssueSeverity; count: number }[];
  open: boolean;
}) {
  return (
    <span className="flex w-full items-center gap-3">
      <ChevronDown size={15} className={cn("shrink-0 text-text-muted transition-transform", !open && "-rotate-90")} />
      <span className="text-sm font-semibold text-text">{label}</span>
      <span className="rounded-full bg-surface-hover px-2 py-px font-mono text-xs text-text-secondary">{total}</span>
      <SeverityCounts counts={counts} />
      <span className="hidden truncate text-xs text-text-muted sm:inline">{hint}</span>
    </span>
  );
}

// ───────────────────────────── table ─────────────────────────────

const COLUMN_COUNT = 11;

export function TranslationIssueTable({ issues, onSelect }: { issues: Issue[]; onSelect: (issue: Issue) => void }) {
  const groups = useMemo(() => groupIssues(issues), [issues]);
  // First group starts open; the rest are collapsed until clicked.
  const [openGroups, setOpenGroups] = useState<Set<GroupKey> | undefined>(undefined);
  const open = openGroups ?? new Set<GroupKey>(groups.length ? [groups[0].key] : []);

  if (issues.length === 0) {
    return <EmptyState title="No translation issues found" body="Nothing matches the current filters." />;
  }

  const toggle = (key: GroupKey) => {
    const next = new Set(open);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setOpenGroups(next);
  };
  const allOpen = groups.every((g) => open.has(g.key));
  const missingLocations = !issues.some((i) => i.location);

  return (
    <Card className="overflow-hidden">
      {missingLocations && (
        <p className="border-b border-border bg-surface-hover px-4 py-2 text-xs text-text-secondary">
          This scan was made before location and visibility were recorded. Rescan to fill in those columns.
        </p>
      )}

      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
        <span className="text-xs text-text-muted">
          {issues.length} {issues.length === 1 ? "issue" : "issues"} in {groups.length} element {groups.length === 1 ? "group" : "groups"}
        </span>
        <button
          type="button"
          onClick={() => setOpenGroups(allOpen ? new Set() : new Set(groups.map((g) => g.key)))}
          className="text-xs font-medium text-accent hover:underline"
        >
          {allOpen ? "Collapse all" : "Expand all"}
        </button>
      </div>

      {/* Mobile: accordion of cards */}
      <div className="divide-y divide-border md:hidden">
        {groups.map((group) => {
          const isOpen = open.has(group.key);
          return (
            <div key={group.key}>
              <button
                type="button"
                onClick={() => toggle(group.key)}
                aria-expanded={isOpen}
                className="flex w-full items-center bg-surface px-4 py-3 text-start hover:bg-surface-hover"
              >
                <GroupHeaderContent label={group.label} hint={group.hint} total={group.items.length} counts={group.counts} open={isOpen} />
              </button>
              {isOpen && (
                <div className="divide-y divide-border border-t border-border">
                  {group.items.map((issue) => {
                    const where = locationLabel(issue);
                    return (
                      <button
                        key={issue.id}
                        onClick={() => onSelect(issue)}
                        className="flex w-full flex-col gap-1.5 px-4 py-3 ps-10 text-start hover:bg-surface-hover"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 text-text-secondary">
                            <PagePath issue={issue} />
                          </span>
                          <SeverityBadge severity={issue.severity} />
                        </div>
                        <p className="text-sm text-text">{issue.message}</p>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
                          {where && <span>{where}</span>}
                          {issue.location?.visibility && (
                            <VisibilityBadge visibility={issue.location.visibility} title={issue.location.visibilityNote} />
                          )}
                          {issue.translationType && <span>{TRANSLATION_TYPE_LABEL[issue.translationType]}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: one table, one collapsible tbody per element group so columns stay aligned */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1280px] text-start text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-text-muted">
              <th className="px-4 py-2.5 text-start font-medium">Page</th>
              <th className="px-4 py-2.5 text-start font-medium">Location</th>
              <th className="px-4 py-2.5 text-start font-medium">Visibility</th>
              <th className="px-4 py-2.5 text-start font-medium">Element</th>
              <th className="px-4 py-2.5 text-start font-medium">Issue</th>
              <th className="px-4 py-2.5 text-start font-medium">Source</th>
              <th className="px-4 py-2.5 text-start font-medium">Target</th>
              <th className="px-4 py-2.5 text-start font-medium">Confidence</th>
              <th className="px-4 py-2.5 text-start font-medium">Severity</th>
              <th className="px-4 py-2.5 text-start font-medium">Status</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          {groups.map((group) => {
            const isOpen = open.has(group.key);
            return (
              <Fragment key={group.key}>
                <tbody className="border-b border-border">
                  <tr>
                    <td colSpan={COLUMN_COUNT} className="p-0">
                      <button
                        type="button"
                        onClick={() => toggle(group.key)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center bg-surface-hover/50 px-4 py-2.5 text-start hover:bg-surface-hover"
                      >
                        <GroupHeaderContent
                          label={group.label}
                          hint={group.hint}
                          total={group.items.length}
                          counts={group.counts}
                          open={isOpen}
                        />
                      </button>
                    </td>
                  </tr>
                </tbody>
                {isOpen && (
                  <tbody className="divide-y divide-border border-b border-border">
                    {group.items.map((issue) => (
                      <IssueRow key={issue.id} issue={issue} onSelect={onSelect} />
                    ))}
                  </tbody>
                )}
              </Fragment>
            );
          })}
        </table>
      </div>
    </Card>
  );
}

function IssueRow({ issue, onSelect }: { issue: Issue; onSelect: (issue: Issue) => void }) {
  const where = locationLabel(issue);
  return (
    <tr onClick={() => onSelect(issue)} className="group cursor-pointer align-top hover:bg-surface-hover">
      <td className="max-w-[13rem] px-4 py-3 ps-11">
        {issue.url ? (
          <a
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={issue.url}
            className="inline-flex max-w-full items-center gap-1 font-mono text-xs text-text-secondary hover:text-accent hover:underline"
          >
            <PagePath issue={issue} />
            <ExternalLink size={11} className="shrink-0" />
          </a>
        ) : (
          <span className="text-text-secondary">
            <PagePath issue={issue} />
          </span>
        )}
      </td>
      <td className="max-w-[12rem] px-4 py-3 text-xs text-text-secondary" title={issue.location?.selector}>
        {where ?? <Dash />}
      </td>
      <td className="px-4 py-3">
        <VisibilityBadge visibility={issue.location?.visibility} title={issue.location?.visibilityNote} />
      </td>
      <td className="px-4 py-3 text-text-secondary">{issue.element ?? <Dash />}</td>
      <td className="max-w-[18rem] px-4 py-3">
        <p className="line-clamp-2 text-text" title={issue.message}>
          {issue.message}
        </p>
        {issue.translationType && <p className="mt-0.5 text-xs text-text-muted">{TRANSLATION_TYPE_LABEL[issue.translationType]}</p>}
      </td>
      <td className="max-w-[10rem] truncate px-4 py-3 text-start text-text" dir="auto" title={issue.sourceText}>
        {issue.sourceText || <Dash />}
      </td>
      <td className="max-w-[10rem] truncate px-4 py-3 text-start text-text" dir="auto" title={issue.targetText}>
        {issue.targetText || <Dash />}
      </td>
      <td className="px-4 py-3 font-mono text-xs text-text-secondary">
        {issue.confidence !== undefined ? `${issue.confidence}%` : <Dash />}
      </td>
      <td className="px-4 py-3">
        <SeverityBadge severity={issue.severity} />
      </td>
      <td className="px-4 py-3">
        <IssueStatusBadge status={issue.status} />
      </td>
      <td className="px-4 py-3 text-end">
        <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100" />
      </td>
    </tr>
  );
}
