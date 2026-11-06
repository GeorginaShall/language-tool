// Core data model for the Multilingual Website Checker.
//
// A "website" entry is a single page URL the user entered. A scan reads that
// page, detects the other language versions it links to, fetches those, and
// compares them — see lib/scanner/pageScanner.ts.

export type LanguageCode = "en" | "ar" | "fr" | "de" | "es" | "zh" | "ja" | "he" | "ur" | "pt";

export type Direction = "ltr" | "rtl";

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  direction: Direction;
}

export type IssueCategory =
  | "translation"
  | "rtl"
  | "seo"
  | "routing"
  | "accessibility";

export type IssueSeverity = "critical" | "warning" | "info";

export type IssueStatus = "open" | "resolved" | "ignored";

export type TranslationIssueType =
  | "missing-translation"
  | "untranslated-text"
  | "identical-translation"
  | "inconsistent-translation"
  | "missing-page"
  | "missing-metadata";

export type ElementType =
  | "heading"
  | "paragraph"
  | "button"
  | "link"
  | "meta-title"
  | "meta-description"
  | "alt-text"
  | "label"
  | "placeholder"
  | "nav-item"
  | "og-tag";

export type RtlAspect =
  | "direction"
  | "typography"
  | "spacing"
  | "layout"
  | "icons"
  | "images"
  | "forms"
  | "navigation";

export interface Issue {
  id: string;
  scanId: string;
  websiteId: string;
  category: IssueCategory;
  severity: IssueSeverity;
  status: IssueStatus;
  /** Path (or host + path, for other hosts) of the page version the issue was found on. */
  page: string;
  /** Full URL of that page version. */
  url?: string;
  element?: ElementType;
  message: string;
  translationType?: TranslationIssueType;
  sourceLanguage?: LanguageCode;
  targetLanguage?: LanguageCode;
  sourceText?: string;
  targetText?: string;
  confidence?: number;
  suggestedAction?: string;
  cssCurrent?: string;
  cssSuggested?: string;
  rtlAspect?: RtlAspect;
  /** Where on the page the offending element sits. */
  location?: IssueLocation;
  createdAt: string;
}

/** visible: seen on load · hidden: needs a click/hover/expand · script-rendered: inserted by JS · screen-reader: visually hidden. */
export type IssueVisibility = "visible" | "hidden" | "script-rendered" | "screen-reader";

export interface IssueLocation {
  /** Page region, e.g. "Header", "Footer", "Pop-up / dialog". */
  region?: string;
  /** Theme section or app block, e.g. "Featured collection". */
  section?: string;
  /** CSS selector to find the element in DevTools. */
  selector?: string;
  visibility?: IssueVisibility;
  /** Why it's not visible on load, when it isn't. */
  visibilityNote?: string;
}

export type ScanStatus = "queued" | "scanning" | "completed" | "failed";

export type LanguageSource = "selected" | "hreflang" | "link";

export type DetectedLanguageStatus = "selected" | "analyzed" | "unreachable" | "not-analyzed";

/** A language version of the scanned page that was discovered on the page itself. */
export interface DetectedLanguage {
  /** Base language subtag, e.g. "ar". */
  code: string;
  /** Tag as declared on the page, e.g. "ar-SA". */
  tag: string;
  name: string;
  direction: Direction;
  url: string;
  sources: LanguageSource[];
  status: DetectedLanguageStatus;
  note?: string;
  /** The on-page language-switcher control pointing at this language, if one was found. */
  switcher?: LanguageSwitcher;
}

export interface LanguageSwitcher {
  /** Visible text of the switcher, e.g. "العربية". */
  label?: string;
  location?: "header" | "navigation" | "footer";
  href: string;
}

export interface Scan {
  id: string;
  websiteId: string;
  status: ScanStatus;
  startedAt: string;
  finishedAt?: string;
  /** The language the user said the page is in. */
  language: LanguageCode;
  /** Final URL of the scanned page, after redirects. */
  pageUrl: string;
  /** What the page itself declares on <html lang>. */
  declaredLang?: string;
  detectedLanguages: DetectedLanguage[];
  translationsChecked: number;
  issueCount: number;
  statusMessage?: string;
  errorMessage?: string;
}

export interface Website {
  id: string;
  /** Normalized page URL, including protocol. */
  url: string;
  /** Display form: host + path, no protocol. */
  label: string;
  languages: Language[];
  lastScanId?: string;
  createdAt: string;
}

export interface PageRecord {
  id: string;
  scanId: string;
  websiteId: string;
  url: string;
  path: string;
  languageCode: LanguageCode;
  isSelected: boolean;
  translationStatus: number; // 0-100
  rtlStatus: "good" | "warning" | "critical";
  seoStatus: "good" | "warning" | "critical";
  issueCount: number;
}

export interface HreflangEntry {
  path: string;
  lang: LanguageCode;
  hreflangOk: boolean;
  canonicalOk: boolean;
  metaTitleOk: boolean;
}

export interface RouteMapping {
  segment: string;
  routes: Partial<Record<LanguageCode, string>>;
  matching: boolean;
}

export interface ComparisonPair {
  id: string;
  key: string;
  sourceText: string;
  targetText: string;
  status: "ok" | "missing" | "extra" | "suspicious-identical";
}

export interface NewScanInput {
  url: string;
  language: LanguageCode;
}
