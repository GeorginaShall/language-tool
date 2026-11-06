"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Issue, IssueVisibility } from "@/types";

const VISIBILITY_STYLE: Record<IssueVisibility, { label: string; className: string }> = {
  visible: { label: "Visible", className: "bg-success-bg text-success" },
  hidden: { label: "Hidden until opened", className: "bg-warning-bg text-warning" },
  "script-rendered": { label: "Added by script", className: "bg-info-bg text-info" },
  "screen-reader": { label: "Screen reader only", className: "bg-surface-hover text-text-muted" },
};

export function VisibilityBadge({ visibility, title }: { visibility?: IssueVisibility; title?: string }) {
  if (!visibility) return <span className="text-text-muted">—</span>;
  const style = VISIBILITY_STYLE[visibility];
  return (
    <span title={title} className={cn("inline-flex whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium", style.className)}>
      {style.label}
    </span>
  );
}

/** "Footer › Footer", "Pop-up / dialog › App block" … */
export function locationLabel(issue: Issue): string | undefined {
  const l = issue.location;
  if (!l) return undefined;
  const parts = [l.region, l.section].filter((p, i, all): p is string => Boolean(p) && all.indexOf(p) === i);
  return parts.length ? parts.join(" › ") : undefined;
}

/**
 * Link that opens the page and highlights the text (Chrome/Edge/Safari text fragments).
 * Only offered for text a visitor can see on load — hidden text can't be scrolled to.
 */
export function findOnPageUrl(issue: Issue): string | undefined {
  if (!issue.url || !issue.targetText || issue.location?.visibility !== "visible") return undefined;
  try {
    const url = new URL(issue.url);
    url.hash = `:~:text=${encodeURIComponent(issue.targetText.slice(0, 80))}`;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function CopyableSelector({ selector }: { selector: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-start gap-2">
      <code className="min-w-0 flex-1 break-all rounded bg-surface-hover px-2 py-1 font-mono text-xs text-text">{selector}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(selector);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            // clipboard unavailable — the selector is still selectable text
          }
        }}
        className="shrink-0 rounded-md border border-border p-1 text-text-muted hover:text-text"
        aria-label="Copy CSS selector"
        title="Copy CSS selector"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

const LOCALE_SEGMENT = /^[a-z]{2}([-_][a-z]{2,4})?$/i;

/**
 * Page URL shortened for tables: no origin, no leading locale segment.
 * https://site.com/ar/collections/rugs → { lang: "ar", path: "/collections/rugs" }.
 */
export function localePath(url: string | undefined, fallback: string): { lang?: string; path: string } {
  if (!url) return { path: fallback };
  try {
    const u = new URL(url);
    const segments = u.pathname.split("/").filter(Boolean);
    const lang = segments[0] && LOCALE_SEGMENT.test(segments[0]) ? segments.shift() : undefined;
    return { lang: lang?.toLowerCase(), path: `/${segments.join("/")}${u.search}` };
  } catch {
    return { path: fallback };
  }
}
