import { CheckCircle2, ExternalLink, TriangleAlert } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { SELECTABLE_LANGUAGES, baseLanguageCode, getLanguage, isCatalogCode } from "@/lib/languages";
import { cn } from "@/lib/utils/cn";
import type { DetectedLanguage, DetectedLanguageStatus, LanguageSource, Scan } from "@/types";

const STATUS_STYLE: Record<DetectedLanguageStatus, { label: string; className: string }> = {
  selected: { label: "Selected", className: "bg-info-bg text-info" },
  analyzed: { label: "Analyzed", className: "bg-success-bg text-success" },
  unreachable: { label: "Unreachable", className: "bg-error-bg text-error" },
  "not-analyzed": { label: "Not analyzed", className: "bg-surface-hover text-text-muted" },
};

const SOURCE_LABEL: Record<LanguageSource, string> = {
  selected: "selected page",
  hreflang: "hreflang tag",
  link: "language link",
};

function CodeBadge({ code, muted }: { code: string; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex w-9 shrink-0 justify-center rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide",
        muted ? "text-text-muted" : "text-text-secondary"
      )}
    >
      {code}
    </span>
  );
}

function displayHref(href: string): string {
  try {
    const u = new URL(href);
    return `${u.pathname}${u.search}` || "/";
  } catch {
    return href;
  }
}

function LanguageRow({ language }: { language: DetectedLanguage }) {
  const status = STATUS_STYLE[language.status];
  return (
    <div className="flex flex-wrap items-start gap-x-3 gap-y-1.5 px-4 py-3">
      <CodeBadge code={language.code} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-text">{language.name}</span>
          {language.direction === "rtl" && (
            <span className="rounded border border-border px-1 py-px font-mono text-[10px] uppercase text-text-muted">rtl</span>
          )}
          <span className="text-xs text-text-muted">via {language.sources.map((s) => SOURCE_LABEL[s]).join(" + ")}</span>
        </div>
        <a
          href={language.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-0.5 inline-flex max-w-full items-center gap-1 font-mono text-xs text-text-secondary hover:text-accent hover:underline"
        >
          <span className="truncate">{language.url}</span>
          <ExternalLink size={11} className="shrink-0" />
        </a>
        {language.switcher?.label && (
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-text-secondary">
            Switcher button{language.switcher.location ? ` in ${language.switcher.location}` : ""}:
            <span
              lang={language.tag}
              dir={language.direction}
              className="rounded border border-border bg-surface px-1.5 py-px text-text"
            >
              {language.switcher.label}
            </span>
            <span className="text-text-muted">→ {displayHref(language.switcher.href)}</span>
          </p>
        )}
        {language.note && <p className="mt-0.5 text-xs text-text-muted">{language.note}</p>}
      </div>
      <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium", status.className)}>{status.label}</span>
    </div>
  );
}

export function DetectedLanguages({ scan }: { scan: Scan }) {
  const selected = getLanguage(scan.language);
  const isUnsupported = (l: DetectedLanguage) => l.status === "not-analyzed" && !isCatalogCode(l.code);
  const compared = scan.detectedLanguages.filter((l) => !isUnsupported(l));
  const unsupported = scan.detectedLanguages.filter(isUnsupported);
  const detectedCodes = new Set(scan.detectedLanguages.map((l) => l.code));
  const missing = SELECTABLE_LANGUAGES.filter((l) => !detectedCodes.has(l.code));
  const declaredMatches = scan.declaredLang ? baseLanguageCode(scan.declaredLang) === selected.code : false;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <h2 className="text-sm font-semibold text-text">Detected languages</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-text-secondary">
          {declaredMatches ? (
            <CheckCircle2 size={13} className="text-success" />
          ) : (
            <TriangleAlert size={13} className="text-warning" />
          )}
          You selected <span className="font-medium text-text">{selected.name}</span>
          {scan.declaredLang ? (
            <>
              ; the page declares <code className="rounded bg-surface-hover px-1 font-mono text-text">lang=&quot;{scan.declaredLang}&quot;</code>
            </>
          ) : (
            <>; the page has no <code className="rounded bg-surface-hover px-1 font-mono text-text">lang</code> attribute</>
          )}
          .
        </p>
      </CardHeader>
      <div className="divide-y divide-border">
        {compared.map((language) => (
          <LanguageRow key={language.code} language={language} />
        ))}
        {unsupported.length > 0 && (
          <details className="group px-4 py-3">
            <summary className="cursor-pointer text-sm text-text-secondary hover:text-text">
              {unsupported.length} more {unsupported.length === 1 ? "language" : "languages"} detected
              <span className="text-text-muted"> — not compared (the checker doesn&apos;t support them yet)</span>
            </summary>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {unsupported.map((language) => (
                <a
                  key={language.code}
                  href={language.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={language.url}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-text-secondary hover:border-accent hover:text-text"
                >
                  <span className="font-mono uppercase text-text-muted">{language.code}</span>
                  {language.name}
                </a>
              ))}
            </div>
          </details>
        )}
        {missing.map((language) => (
          <div key={language.code} className="flex items-center gap-3 px-4 py-3">
            <CodeBadge code={language.code} muted />
            <span className="text-sm text-text-muted">{language.name}</span>
            <span className="text-xs text-text-muted">— not detected on this page</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
