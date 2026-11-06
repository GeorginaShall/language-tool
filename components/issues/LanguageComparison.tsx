"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { ComparisonPair, Language } from "@/types";

const STATUS_LABEL: Record<ComparisonPair["status"], string> = {
  ok: "",
  missing: "Missing content",
  extra: "Extra content",
  "suspicious-identical": "Suspicious: identical",
};

export function LanguageComparison({
  pairs,
  sourceLang,
  targetLang,
}: {
  pairs: ComparisonPair[];
  sourceLang: Language;
  targetLang: Language;
}) {
  const flagged = useMemo(() => pairs.filter((p) => p.status !== "ok"), [pairs]);
  const [activeId, setActiveId] = useState<string | undefined>(flagged[0]?.id);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const activeIndex = flagged.findIndex((p) => p.id === activeId);

  function jumpTo(index: number) {
    const pair = flagged[index];
    if (!pair) return;
    setActiveId(pair.id);
    rowRefs.current[pair.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="space-y-3">
      {flagged.length > 0 && (
        <div className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2">
          <span className="text-xs text-text-secondary">
            {activeIndex + 1} of {flagged.length} flagged differences
          </span>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => jumpTo(activeIndex - 1)} disabled={activeIndex <= 0}>
              <ChevronLeft size={14} />
              Previous issue
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => jumpTo(activeIndex + 1)}
              disabled={activeIndex >= flagged.length - 1}
            >
              Next issue
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="grid grid-cols-2 border-b border-border bg-surface/60 text-xs font-medium uppercase tracking-wide text-text-muted">
          <div className="px-4 py-2.5">{sourceLang.name}</div>
          <div className="px-4 py-2.5">{targetLang.name}</div>
        </div>
        <div className="divide-y divide-border">
          {pairs.map((pair) => (
            <div
              key={pair.id}
              ref={(el) => {
                rowRefs.current[pair.id] = el;
              }}
              className={cn(
                "grid grid-cols-2 gap-4 px-4 py-3 transition-colors",
                pair.id === activeId && pair.status !== "ok" && "bg-warning-bg/50"
              )}
            >
              <div>
                <p className="text-xs text-text-muted">{pair.key}</p>
                <p className="mt-0.5 text-sm text-text" dir={sourceLang.direction}>
                  {pair.sourceText || "—"}
                </p>
              </div>
              <div>
                {pair.status !== "ok" && (
                  <p className="text-xs font-medium text-warning">{STATUS_LABEL[pair.status]}</p>
                )}
                <p
                  className={cn("mt-0.5 text-sm", pair.status === "missing" ? "text-text-muted" : "text-text")}
                  dir={targetLang.direction}
                >
                  {pair.targetText || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
