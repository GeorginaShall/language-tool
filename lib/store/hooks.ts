"use client";

import { useMemo, useSyncExternalStore } from "react";
import { dataStore, type StoreState } from "./data-store";

// Returns the raw store state. The reference only changes when a mutation
// happens (see DataStore.set), so it is safe to pass to useSyncExternalStore
// directly — derived/filtered views are memoized separately below instead of
// being computed inside the snapshot getter (which must return a stable
// reference to avoid re-render loops).
function useRawState(): StoreState {
  return useSyncExternalStore(
    (listener) => dataStore.subscribe(listener),
    () => dataStore.getState(),
    () => dataStore.getState()
  );
}

export function useWebsites() {
  return useRawState().websites;
}

export function useWebsite(id: string | undefined) {
  const websites = useRawState().websites;
  return useMemo(() => websites.find((w) => w.id === id), [websites, id]);
}

export function useScansForWebsite(websiteId: string | undefined) {
  const scans = useRawState().scans;
  return useMemo(
    () =>
      scans
        .filter((sc) => sc.websiteId === websiteId)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [scans, websiteId]
  );
}

export function useScan(scanId: string | undefined) {
  const scans = useRawState().scans;
  return useMemo(() => scans.find((sc) => sc.id === scanId), [scans, scanId]);
}

export function useIssuesForScan(scanId: string | undefined) {
  const issues = useRawState().issues;
  return useMemo(() => issues.filter((i) => i.scanId === scanId), [issues, scanId]);
}

export function useIssue(issueId: string | undefined) {
  const issues = useRawState().issues;
  return useMemo(() => issues.find((i) => i.id === issueId), [issues, issueId]);
}

export function usePagesForScan(scanId: string | undefined) {
  const pages = useRawState().pages;
  return useMemo(() => pages.filter((p) => p.scanId === scanId), [pages, scanId]);
}

export function useAllScans() {
  const scans = useRawState().scans;
  return useMemo(
    () => [...scans].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
    [scans]
  );
}

export function useAllIssues() {
  return useRawState().issues;
}

export function useAllPages() {
  return useRawState().pages;
}

export function useHreflangForScan(scanId: string | undefined) {
  const hreflang = useRawState().hreflang;
  return useMemo(() => (scanId ? hreflang[scanId] ?? [] : []), [hreflang, scanId]);
}

export function useRoutingForScan(scanId: string | undefined) {
  const routing = useRawState().routing;
  return useMemo(() => (scanId ? routing[scanId] ?? [] : []), [routing, scanId]);
}

export function useComparison(scanId: string | undefined, languageCode: string | undefined) {
  const comparisons = useRawState().comparisons;
  return useMemo(
    () => (scanId && languageCode ? comparisons[`${scanId}:${languageCode}`] ?? [] : []),
    [comparisons, scanId, languageCode]
  );
}
