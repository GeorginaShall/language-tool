"use client";

import { ExternalLink, Search } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { SeverityBadge, IssueStatusBadge } from "@/components/ui/Badge";
import { CodeSuggestion } from "@/components/ui/CodeSuggestion";
import { CopyableSelector, VisibilityBadge, findOnPageUrl, locationLabel } from "@/components/issues/IssueLocation";
import { setIssueStatus } from "@/lib/api/scans";
import { useToast } from "@/context/ToastContext";
import { useWebsite } from "@/lib/store/hooks";
import type { Issue, IssueStatus } from "@/types";

const TRANSLATION_TYPE_LABEL: Record<NonNullable<Issue["translationType"]>, string> = {
  "missing-translation": "Missing translation",
  "untranslated-text": "Untranslated text",
  "identical-translation": "Identical translation",
  "inconsistent-translation": "Potentially inconsistent translation",
  "missing-page": "Missing page",
  "missing-metadata": "Missing metadata",
};

export function IssueDrawer({ issue, onClose }: { issue: Issue | undefined; onClose: () => void }) {
  const { toast } = useToast();
  const website = useWebsite(issue?.websiteId);

  if (!issue) return null;

  async function handleStatus(status: IssueStatus) {
    if (!issue) return;
    await setIssueStatus(issue.id, status);
    const message =
      status === "resolved" ? "Issue marked as resolved." : status === "ignored" ? "Issue ignored." : "Issue reopened.";
    toast(message, status === "resolved" ? "success" : "info");
    onClose();
  }

  const pageUrl = issue.url ?? website?.url;
  const where = locationLabel(issue);
  const findUrl = findOnPageUrl(issue);

  return (
    <Drawer
      isOpen={Boolean(issue)}
      onClose={onClose}
      eyebrow={issue.category === "translation" ? "Translation Issue" : `${issue.category} issue`}
      title={issue.page}
      footer={
        issue.status === "open" ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={() => handleStatus("resolved")}>
              Mark as resolved
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleStatus("ignored")}>
              Ignore
            </Button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => handleStatus("open")}>
            Reopen
          </Button>
        )
      }
    >
      <div className="space-y-5">
        {pageUrl && (
          <Field label="Page URL">
            <a
              href={pageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-full items-center gap-1 break-all font-mono text-sm text-text hover:text-accent hover:underline"
            >
              {pageUrl}
              <ExternalLink size={12} className="shrink-0" />
            </a>
          </Field>
        )}

        {where && (
          <Field label="Location on page">
            <span className="text-sm text-text">{where}</span>
          </Field>
        )}

        {issue.location?.visibility && (
          <Field label="Visibility">
            <div className="space-y-1">
              <VisibilityBadge visibility={issue.location.visibility} />
              {issue.location.visibilityNote && <p className="text-sm text-text-secondary">{issue.location.visibilityNote}</p>}
            </div>
          </Field>
        )}

        {issue.location?.selector && (
          <Field label="CSS selector">
            <CopyableSelector selector={issue.location.selector} />
            <p className="mt-1 text-xs text-text-muted">Paste into DevTools (Elements → Ctrl+F) to jump to the element.</p>
          </Field>
        )}

        {issue.element && (
          <Field label="Element">
            <span className="font-mono text-sm text-text">{issue.element}</span>
          </Field>
        )}

        {(issue.sourceText !== undefined || issue.targetText !== undefined) && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={issue.sourceLanguage ? issue.sourceLanguage.toUpperCase() : "Source"}>
              <p className="text-sm text-text" dir="auto">
                {issue.sourceText || <Dash />}
              </p>
            </Field>
            <Field label={issue.targetLanguage ? issue.targetLanguage.toUpperCase() : "Target"}>
              <p className="text-sm text-text" dir="auto">
                {issue.targetText || <Dash />}
              </p>
            </Field>
          </div>
        )}

        {issue.translationType && (
          <Field label="Issue">
            <span className="text-sm text-text">{TRANSLATION_TYPE_LABEL[issue.translationType]}</span>
          </Field>
        )}

        {!issue.translationType && (
          <Field label="Message">
            <p className="text-sm text-text">{issue.message}</p>
          </Field>
        )}

        <Field label="Severity">
          <SeverityBadge severity={issue.severity} />
        </Field>

        <Field label="Status">
          <IssueStatusBadge status={issue.status} />
        </Field>

        {issue.confidence !== undefined && (
          <Field label="Confidence">
            <span className="font-mono text-sm text-text">{issue.confidence}%</span>
          </Field>
        )}

        {(issue.cssCurrent || issue.cssSuggested) && (
          <Field label="Suggested fix">
            <CodeSuggestion current={issue.cssCurrent ?? ""} suggested={issue.cssSuggested ?? ""} />
          </Field>
        )}

        {issue.suggestedAction && (
          <Field label="Suggested action">
            <p className="text-sm text-text-secondary">{issue.suggestedAction}</p>
          </Field>
        )}

        {(findUrl || pageUrl) && (
          <div className="flex flex-wrap gap-4">
            {findUrl && (
              <a
                href={findUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                Find on page
                <Search size={13} />
              </a>
            )}
            {pageUrl && (
              <a
                href={pageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                View page
                <ExternalLink size={13} />
              </a>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Dash() {
  return <span className="text-text-muted">—</span>;
}
