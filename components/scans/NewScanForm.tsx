"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanSearch } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageLanguageSelect } from "./LanguageSelector";
import { scanWebsite } from "@/lib/api/scans";
import { normalizePageUrl } from "@/lib/utils/url";
import { useToast } from "@/context/ToastContext";
import type { LanguageCode } from "@/types";

export function NewScanForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [error, setError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!normalizePageUrl(url)) {
      setError("Enter a valid page URL, for example https://example.com/about.");
      return;
    }
    setError(undefined);
    setSubmitting(true);
    try {
      const { scanId } = await scanWebsite({ url, language });
      router.push(`/scans/${scanId}`);
    } catch {
      toast("Could not start the scan. Please try again.", "warning");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Card className="space-y-5 p-4 sm:p-5">
        <div>
          <label htmlFor="scan-url" className="text-[13px] font-medium text-text">
            Page URL
          </label>
          <input
            id="scan-url"
            type="text"
            inputMode="url"
            autoComplete="off"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(undefined);
            }}
            placeholder="https://example.com/about"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "scan-url-error" : undefined}
            className="mt-1.5 h-9 w-full rounded-md border border-border bg-bg px-3 font-mono text-sm text-text placeholder:text-text-muted focus:border-accent"
          />
          {error && (
            <p id="scan-url-error" role="alert" className="mt-1.5 text-xs text-error">
              {error}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="page-language" className="text-[13px] font-medium text-text">
            Language of this page
          </label>
          <div className="mt-1.5">
            <PageLanguageSelect id="page-language" value={language} onChange={setLanguage} />
          </div>
          <p className="mt-1.5 text-xs text-text-secondary">
            The page is read as-is, its other language versions are detected from its hreflang tags and language
            links, and each one is compared against this page.
          </p>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={submitting || url.trim().length === 0}>
          <ScanSearch size={15} />
          {submitting ? "Starting…" : "Start Scan"}
        </Button>
      </div>
    </form>
  );
}
