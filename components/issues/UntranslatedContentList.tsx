import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Issue } from "@/types";

export function UntranslatedContentList({ issues }: { issues: Issue[] }) {
  const items = issues.filter(
    (i) => (i.translationType === "identical-translation" || i.translationType === "untranslated-text") && i.sourceText
  );

  if (items.length === 0) {
    return (
      <EmptyState
        title="No untranslated content detected"
        body="No text was found that is identical between the language versions."
      />
    );
  }

  return (
    <Card className="divide-y divide-border overflow-hidden">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span className="uppercase">{item.sourceLanguage}</span>
              <span>→</span>
              <span className="uppercase">{item.targetLanguage}</span>
              <span className="truncate font-mono">{item.page}</span>
            </div>
            <p className="mt-0.5 truncate text-sm text-text">&ldquo;{item.sourceText}&rdquo;</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded-md bg-warning-bg px-1.5 py-0.5 text-xs font-medium text-warning">Potential issue</span>
            {item.confidence !== undefined && (
              <span className="font-mono text-xs text-text-muted">Confidence: {item.confidence}%</span>
            )}
          </div>
        </div>
      ))}
    </Card>
  );
}
