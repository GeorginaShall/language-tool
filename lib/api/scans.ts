import type { Issue, IssueStatus, LanguageCode, NewScanInput, PageRecord, Scan, Website } from "@/types";
import { dataStore } from "@/lib/store/data-store";
import { getLanguage, isCatalogCode } from "@/lib/languages";
import { normalizePageUrl } from "@/lib/utils/url";
import type { ScanResult } from "@/lib/scanner/pageScanner";

// ─────────────────────────────────────────────────────────────────────────
// This module is the seam between the UI and scan data. Every function is
// async and returns plain data. scanWebsite() runs the real scanner through
// POST /api/scan (see app/api/scan/route.ts and lib/scanner/pageScanner.ts) —
// swapping in a different backend later means changing only the fetch call
// below, not any component.
// ─────────────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slug(label: string): string {
  return label.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

export async function listWebsites(): Promise<Website[]> {
  return dataStore.getState().websites;
}

export async function getWebsite(id: string): Promise<Website | undefined> {
  return dataStore.getState().websites.find((w) => w.id === id);
}

export async function removeWebsite(id: string): Promise<void> {
  await delay(150);
  dataStore.removeWebsite(id);
}

export async function listScans(): Promise<Scan[]> {
  return dataStore.getState().scans;
}

export async function getScan(id: string): Promise<Scan | undefined> {
  return dataStore.getState().scans.find((s) => s.id === id);
}

export async function getScansForWebsite(websiteId: string): Promise<Scan[]> {
  return dataStore
    .getState()
    .scans.filter((s) => s.websiteId === websiteId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export async function getIssues(scanId: string): Promise<Issue[]> {
  return dataStore.getState().issues.filter((i) => i.scanId === scanId);
}

export async function getIssue(id: string): Promise<Issue | undefined> {
  return dataStore.getState().issues.find((i) => i.id === id);
}

export async function getPages(scanId: string): Promise<PageRecord[]> {
  return dataStore.getState().pages.filter((p) => p.scanId === scanId);
}

export async function setIssueStatus(issueId: string, status: IssueStatus): Promise<void> {
  await delay(150);
  dataStore.setIssueStatus(issueId, status);
}

const STATUS_MESSAGES = [
  "Fetching the page…",
  "Reading its language tags and links…",
  "Detecting other language versions…",
  "Fetching and comparing each version…",
  "Checking layout direction…",
];

function runStatusTicker(scanId: string): () => void {
  let i = 0;
  dataStore.updateScan(scanId, { statusMessage: STATUS_MESSAGES[0] });
  const interval = setInterval(() => {
    i = Math.min(i + 1, STATUS_MESSAGES.length - 1);
    dataStore.updateScan(scanId, { statusMessage: STATUS_MESSAGES[i] });
  }, 1800);
  return () => clearInterval(interval);
}

function failScan(scanId: string, errorMessage: string) {
  dataStore.updateScan(scanId, {
    status: "failed",
    finishedAt: new Date().toISOString(),
    errorMessage,
    statusMessage: undefined,
  });
}

async function runScan(website: Website, scanId: string, input: NewScanInput) {
  const stopTicker = runStatusTicker(scanId);

  try {
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: website.url, language: input.language }),
    });
    const data: { ok: true; result: ScanResult } | { ok: false; error: string } = await res.json();
    stopTicker();

    if (!data.ok) {
      failScan(scanId, data.error);
      return;
    }

    const { result } = data;
    const pages: PageRecord[] = result.pages.map((p, idx) => ({
      ...p,
      id: `${scanId}-pg-${idx}`,
      scanId,
      websiteId: website.id,
    }));
    // On an in-place rescan, keep "resolved" / "ignored" on issues that are still found.
    const previousStatus = new Map(
      dataStore
        .getState()
        .issues.filter((i) => i.scanId === scanId && i.status !== "open")
        .map((i) => [`${i.page}|${i.message}`, i.status])
    );
    const issues: Issue[] = result.issues.map((issue, idx) => ({
      ...issue,
      id: `${scanId}-iss-${idx}`,
      scanId,
      websiteId: website.id,
      status: previousStatus.get(`${issue.page}|${issue.message}`) ?? "open",
      createdAt: new Date().toISOString(),
    }));

    dataStore.clearScanResults(scanId);
    dataStore.addPages(pages);
    dataStore.addIssues(issues);
    dataStore.setScanTables(scanId, { hreflang: result.hreflang, routing: result.routing, comparisons: result.comparisons });

    const languageCodes: LanguageCode[] = [
      input.language,
      ...result.detectedLanguages.map((l) => l.code).filter(isCatalogCode),
    ];
    dataStore.updateWebsite(website.id, {
      languages: Array.from(new Set(languageCodes)).map(getLanguage),
      lastScanId: scanId,
    });
    dataStore.updateScan(scanId, {
      status: "completed",
      finishedAt: new Date().toISOString(),
      pageUrl: result.pageUrl,
      declaredLang: result.declaredLang,
      detectedLanguages: result.detectedLanguages,
      translationsChecked: result.translationsChecked,
      issueCount: issues.length,
      statusMessage: undefined,
    });
  } catch {
    stopTicker();
    failScan(scanId, "Something went wrong while scanning this page.");
  }
}

export async function scanWebsite(input: NewScanInput): Promise<{ websiteId: string; scanId: string }> {
  const normalized = normalizePageUrl(input.url);
  if (!normalized) throw new Error("Enter a valid page URL, for example https://example.com/about.");

  await delay(100);
  const existing = dataStore.getState().websites.find((w) => w.url === normalized.url);
  const website: Website = existing ?? {
    id: `web-${slug(normalized.label)}-${Date.now()}`,
    url: normalized.url,
    label: normalized.label,
    languages: [getLanguage(input.language)],
    createdAt: new Date().toISOString(),
  };
  if (!existing) dataStore.addWebsite(website);

  const scanId = `scan-${slug(normalized.label)}-${Date.now()}`;
  const scan: Scan = {
    id: scanId,
    websiteId: website.id,
    status: "scanning",
    startedAt: new Date().toISOString(),
    language: input.language,
    pageUrl: normalized.url,
    detectedLanguages: [],
    translationsChecked: 0,
    issueCount: 0,
  };
  dataStore.addScan(scan);

  void runScan(website, scanId, input);

  return { websiteId: website.id, scanId };
}

export async function rescan(scanId: string): Promise<{ websiteId: string; scanId: string } | undefined> {
  const scan = dataStore.getState().scans.find((s) => s.id === scanId);
  const website = scan && dataStore.getState().websites.find((w) => w.id === scan.websiteId);
  if (!scan || !website) return undefined;
  return scanWebsite({ url: website.url, language: scan.language });
}

/** Re-runs an existing scan under the same id, replacing its results instead of adding a new scan to the history. */
export async function rescanInPlace(scanId: string): Promise<boolean> {
  const scan = dataStore.getState().scans.find((s) => s.id === scanId);
  const website = scan && dataStore.getState().websites.find((w) => w.id === scan.websiteId);
  if (!scan || !website || scan.status === "scanning") return false;

  dataStore.updateScan(scanId, {
    status: "scanning",
    startedAt: new Date().toISOString(),
    finishedAt: undefined,
    errorMessage: undefined,
  });
  void runScan(website, scanId, { url: website.url, language: scan.language });
  return true;
}
