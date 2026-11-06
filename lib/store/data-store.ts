import type {
  ComparisonPair,
  HreflangEntry,
  Issue,
  IssueStatus,
  PageRecord,
  RouteMapping,
  Scan,
  Website,
} from "@/types";

export interface StoreState {
  websites: Website[];
  scans: Scan[];
  issues: Issue[];
  pages: PageRecord[];
  /** Keyed by scan id. */
  hreflang: Record<string, HreflangEntry[]>;
  routing: Record<string, RouteMapping[]>;
  /** Keyed by `${scanId}:${languageCode}` — selected page vs. that language version. */
  comparisons: Record<string, ComparisonPair[]>;
}

type Listener = () => void;

const STORAGE_KEY = "mwc-store-v2";

function emptyState(): StoreState {
  return {
    websites: [],
    scans: [],
    issues: [],
    pages: [],
    hreflang: {},
    routing: {},
    comparisons: {},
  };
}

// A minimal observable store — deliberately framework-agnostic so the same
// shape of state could later be backed by react-query / SWR / a real API
// without changing how components read from it (see lib/store/hooks.ts).
//
// State is persisted to localStorage on every change and re-hydrated once on
// mount (see hydrate(), called from context/Providers.tsx). The constructor
// always starts empty — matching what the server renders — so hydration
// happens as a deliberate post-mount step instead of causing a mismatch.
class DataStore {
  private state: StoreState = emptyState();
  private listeners = new Set<Listener>();
  private hydrated = false;

  getState(): StoreState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private set(partial: Partial<StoreState>) {
    this.state = { ...this.state, ...partial };
    this.listeners.forEach((l) => l());
    this.persist();
  }

  private persist() {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage full or unavailable (private browsing, etc.) — non-fatal.
    }
  }

  /** Loads persisted state from localStorage, if present. Call once, after mount. */
  hydrate() {
    if (this.hydrated || typeof window === "undefined") return;
    this.hydrated = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      this.state = { ...emptyState(), ...parsed };
      this.listeners.forEach((l) => l());
    } catch {
      // Corrupted or unreadable storage — carry on with the empty state.
    }
  }

  addWebsite(website: Website) {
    this.set({ websites: [website, ...this.state.websites] });
  }

  updateWebsite(websiteId: string, patch: Partial<Website>) {
    this.set({
      websites: this.state.websites.map((w) => (w.id === websiteId ? { ...w, ...patch } : w)),
    });
  }

  removeWebsite(websiteId: string) {
    const scanIds = new Set(this.state.scans.filter((s) => s.websiteId === websiteId).map((s) => s.id));
    const dropScanKeys = <T,>(record: Record<string, T>) =>
      Object.fromEntries(Object.entries(record).filter(([key]) => !scanIds.has(key.split(":")[0])));

    this.set({
      websites: this.state.websites.filter((w) => w.id !== websiteId),
      scans: this.state.scans.filter((s) => s.websiteId !== websiteId),
      issues: this.state.issues.filter((i) => !scanIds.has(i.scanId)),
      pages: this.state.pages.filter((p) => !scanIds.has(p.scanId)),
      hreflang: dropScanKeys(this.state.hreflang),
      routing: dropScanKeys(this.state.routing),
      comparisons: dropScanKeys(this.state.comparisons),
    });
  }

  addScan(scan: Scan) {
    this.set({ scans: [scan, ...this.state.scans] });
  }

  updateScan(scanId: string, patch: Partial<Scan>) {
    this.set({
      scans: this.state.scans.map((s) => (s.id === scanId ? { ...s, ...patch } : s)),
    });
  }

  /** Drops a scan's pages, issues and tables so it can be re-run in place. */
  clearScanResults(scanId: string) {
    const dropScanKeys = <T,>(record: Record<string, T>) =>
      Object.fromEntries(Object.entries(record).filter(([key]) => key.split(":")[0] !== scanId));

    this.set({
      issues: this.state.issues.filter((i) => i.scanId !== scanId),
      pages: this.state.pages.filter((p) => p.scanId !== scanId),
      hreflang: dropScanKeys(this.state.hreflang),
      routing: dropScanKeys(this.state.routing),
      comparisons: dropScanKeys(this.state.comparisons),
    });
  }

  addPages(pages: PageRecord[]) {
    this.set({ pages: [...this.state.pages, ...pages] });
  }

  addIssues(issues: Issue[]) {
    this.set({ issues: [...this.state.issues, ...issues] });
  }

  setIssueStatus(issueId: string, status: IssueStatus) {
    this.set({
      issues: this.state.issues.map((i) => (i.id === issueId ? { ...i, status } : i)),
    });
  }

  setScanTables(
    scanId: string,
    tables: {
      hreflang: HreflangEntry[];
      routing: RouteMapping[];
      comparisons: Record<string, ComparisonPair[]>;
    }
  ) {
    const comparisons = { ...this.state.comparisons };
    for (const [language, pairs] of Object.entries(tables.comparisons)) {
      comparisons[`${scanId}:${language}`] = pairs;
    }
    this.set({
      hreflang: { ...this.state.hreflang, [scanId]: tables.hreflang },
      routing: { ...this.state.routing, [scanId]: tables.routing },
      comparisons,
    });
  }
}

export const dataStore = new DataStore();
