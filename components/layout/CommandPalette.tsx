"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { FileText, Globe, Languages as LanguagesIcon, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useCommandPalette } from "@/context/CommandPaletteContext";
import { useAllIssues, useAllPages, useWebsites } from "@/lib/store/hooks";
import { ALL_LANGUAGES, getLanguage } from "@/lib/languages";
import { ISSUE_CATEGORY_CONFIG } from "@/lib/issue-categories";

interface PaletteResult {
  id: string;
  group: "Websites" | "Pages" | "Issues" | "Languages";
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
}

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const websites = useWebsites();
  const issues = useAllIssues();
  const pages = useAllPages();

  useEffect(() => {
    if (isOpen) {
      // Reset transient dialog state on open — the palette instance persists
      // across open/close cycles, so this can't be a lazy useState initializer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const results = useMemo<PaletteResult[]>(() => {
    const websiteResults: PaletteResult[] = websites.map((w) => ({
      id: w.id,
      group: "Websites",
      label: w.label,
      sublabel: w.languages.map((l) => l.code.toUpperCase()).join(" / "),
      icon: Globe,
      href: `/websites/${w.id}`,
    }));

    const issueResults: PaletteResult[] = issues.slice(0, 60).map((i) => ({
      id: i.id,
      group: "Issues",
      label: i.message,
      sublabel: i.page,
      icon: TriangleAlert,
      href:
        i.category === "translation"
          ? `/scans/${i.scanId}/translation?issue=${i.id}`
          : `/scans/${i.scanId}/${ISSUE_CATEGORY_CONFIG[i.category].hrefSegment}`,
    }));

    const languageResults: PaletteResult[] = ALL_LANGUAGES.map((l) => ({
      id: l.code,
      group: "Languages",
      label: `${l.name} (${l.nativeName})`,
      sublabel: l.direction.toUpperCase(),
      icon: LanguagesIcon,
      href: `/settings`,
    }));

    const pageResults: PaletteResult[] = pages.map((p) => ({
      id: p.id,
      group: "Pages",
      label: p.path,
      sublabel: getLanguage(p.languageCode).name,
      icon: FileText,
      href: `/scans/${p.scanId}/pages/${p.id}`,
    }));

    const all = [...websiteResults, ...pageResults, ...issueResults, ...languageResults];
    if (!query.trim()) return all.slice(0, 8);

    const q = query.toLowerCase();
    return all.filter((r) => r.label.toLowerCase().includes(q) || r.sublabel?.toLowerCase().includes(q)).slice(0, 20);
  }, [query, websites, issues, pages]);

  function go(result: PaletteResult) {
    router.push(result.href);
    close();
  }

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const picked = results[activeIndex];
        if (picked) go(picked);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, results, activeIndex]);

  if (!isOpen || typeof document === "undefined") return null;

  let flatIndex = -1;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={close} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative z-10 w-full max-w-lg animate-fade-in overflow-hidden rounded-[10px] border border-border bg-surface shadow-2xl"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          placeholder="Search websites, pages, issues, languages…"
          className="w-full border-b border-border bg-transparent px-4 py-3.5 text-sm text-text placeholder:text-text-muted focus:outline-none"
          aria-label="Search everything"
        />
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-text-secondary">No results for &ldquo;{query}&rdquo;</p>
          )}
          {(["Websites", "Pages", "Issues", "Languages"] as const).map((group) => {
            const groupResults = results.filter((r) => r.group === group);
            if (groupResults.length === 0) return null;
            return (
              <div key={group} className="px-2 py-1">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{group}</p>
                {groupResults.map((r) => {
                  flatIndex += 1;
                  const isActive = flatIndex === activeIndex;
                  const Icon = r.icon;
                  return (
                    <button
                      key={`${r.group}-${r.id}`}
                      onClick={() => go(r)}
                      onMouseEnter={() => setActiveIndex(flatIndex)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-start text-sm",
                        isActive ? "bg-surface-hover text-text" : "text-text-secondary"
                      )}
                    >
                      <Icon size={15} className="shrink-0 text-text-muted" />
                      <span className="truncate">{r.label}</span>
                      {r.sublabel && <span className="ms-auto shrink-0 font-mono text-xs text-text-muted">{r.sublabel}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
