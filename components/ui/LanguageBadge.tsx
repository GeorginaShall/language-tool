import { cn } from "@/lib/utils/cn";
import type { Language, LanguageCode } from "@/types";
import { getLanguage } from "@/lib/languages";

export function LanguageBadge({
  language,
  className,
  showDirection = false,
}: {
  language: Language | LanguageCode;
  className?: string;
  showDirection?: boolean;
}) {
  const lang = typeof language === "string" ? getLanguage(language) : language;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide text-text-secondary",
        className
      )}
      title={lang.name}
    >
      {lang.code}
      {showDirection && <span className="text-text-muted normal-case">· {lang.direction}</span>}
    </span>
  );
}

export function LanguageBadgeGroup({ languages, className }: { languages: (Language | LanguageCode)[]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {languages.map((l, i) => {
        const lang = typeof l === "string" ? getLanguage(l) : l;
        return <LanguageBadge key={lang.code + i} language={lang} />;
      })}
    </span>
  );
}
