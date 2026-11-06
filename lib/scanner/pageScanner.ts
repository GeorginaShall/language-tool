import * as cheerio from "cheerio";
import type {
  ComparisonPair,
  DetectedLanguage,
  ElementType,
  IssueLocation,
  HreflangEntry,
  Issue,
  LanguageCode,
  LanguageSource,
  LanguageSwitcher,
  PageRecord,
  RouteMapping,
} from "@/types";
import {
  ALL_LANGUAGES,
  SELECTABLE_LANGUAGES,
  baseLanguageCode,
  describeLanguage,
  getLanguage,
  isCatalogCode,
} from "@/lib/languages";
import { normalizePageUrl } from "@/lib/utils/url";

// ─────────────────────────────────────────────────────────────────────────
// Scans ONE page: fetches the URL, reads the language information the page
// publishes about itself (<html lang>, hreflang alternates, language-switcher
// links), fetches those other language versions, and compares them with the
// selected one. Nothing here is simulated — every finding is derived from the
// live HTML/CSS that was fetched.
//
// Inherent limits of a static fetch: client-rendered pages only expose their
// initial HTML, sites that block automated requests fail, and "is this text
// translated" is inferred (identical strings, script/stop-word language
// detection), not linguistically verified.
// ─────────────────────────────────────────────────────────────────────────

const FETCH_TIMEOUT_MS = 9000;
const MAX_ALTERNATES = 4;
const MAX_STYLESHEETS_PER_PAGE = 3;
const MAX_STYLESHEET_BYTES = 300_000;
const USER_AGENT = "Mozilla/5.0 (compatible; MultilingualWebsiteChecker/1.0)";

export class ScanError extends Error {}

function assertPubliclyFetchable(url: URL) {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ScanError("Only http and https URLs can be scanned.");
  }
  const host = url.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host.endsWith(".local");
  if (blocked) {
    throw new ScanError("This URL points to a private or local address and can't be scanned.");
  }
}

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string }> {
  assertPubliclyFetchable(new URL(url));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
    });
    if (!res.ok) throw new ScanError(`The server responded with HTTP ${res.status}.`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new ScanError("That URL didn't return an HTML page.");
    }
    const finalUrl = res.url || url;
    assertPubliclyFetchable(new URL(finalUrl));
    return { html: await res.text(), finalUrl };
  } catch (err) {
    if (err instanceof ScanError) throw err;
    if (err instanceof Error && err.name === "AbortError") throw new ScanError("The site took too long to respond.");
    throw new ScanError("Could not reach that page. It may be down, blocking automated requests, or unreachable from here.");
  } finally {
    clearTimeout(timeout);
  }
}

// ───────────────────────────── language detection helpers ─────────────────────────────

const LABEL_TO_CODE: Record<string, string> = {};
for (const lang of ALL_LANGUAGES) {
  LABEL_TO_CODE[lang.name.toLowerCase()] = lang.code;
  LABEL_TO_CODE[lang.nativeName.toLowerCase()] = lang.code;
  LABEL_TO_CODE[lang.code] = lang.code;
}
Object.assign(LABEL_TO_CODE, { عربي: "ar", francais: "fr", anglais: "en", "english (us)": "en", "english (uk)": "en" });

function codeFromLabel(text: string): string | undefined {
  const t = text.trim().toLowerCase();
  return t.length > 0 && t.length <= 24 ? LABEL_TO_CODE[t] : undefined;
}

/** A language code hinted by the URL itself: /ar/..., ar.example.com, or ?lang=ar. */
function urlHintCode(url: URL): string | undefined {
  const firstSegment = url.pathname.split("/").filter(Boolean)[0];
  if (firstSegment && /^[a-z]{2}(-[a-z]{2,4})?$/i.test(firstSegment)) return baseLanguageCode(firstSegment);
  const labels = url.hostname.split(".");
  if (labels.length > 2 && /^[a-z]{2}$/i.test(labels[0])) return labels[0].toLowerCase();
  for (const key of ["lang", "locale", "hl", "language"]) {
    const v = url.searchParams.get(key);
    if (v && /^[a-z]{2}([-_][a-z]{2,4})?$/i.test(v)) return baseLanguageCode(v);
  }
  return undefined;
}

const STOPWORDS: Record<"en" | "fr", string[]> = {
  en: ["the", "and", "of", "to", "in", "is", "for", "with", "on", "that", "this", "are", "you", "your", "from", "by", "as", "be", "or", "it", "an", "our", "we"],
  fr: ["le", "la", "les", "des", "et", "est", "pour", "une", "un", "du", "en", "que", "dans", "sur", "avec", "pas", "au", "aux", "ce", "vous", "nous", "par", "plus", "sont"],
};

/** Best-effort language of a block of text. Only distinguishes English, Arabic and French. */
function detectContentLanguage(text: string): { code: "en" | "ar" | "fr"; confidence: number } | undefined {
  const sample = text.slice(0, 6000);
  const arabic = (sample.match(/[؀-ۿݐ-ݿ]/g) ?? []).length;
  const latin = (sample.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  const total = arabic + latin;
  if (total < 80) return undefined;
  if (arabic / total > 0.5) return { code: "ar", confidence: Math.round((arabic / total) * 100) };

  const words = sample.toLowerCase().match(/[a-zà-ÿ]+/g) ?? [];
  const count = (list: string[]) => words.filter((w) => list.includes(w)).length;
  const en = count(STOPWORDS.en);
  const fr = count(STOPWORDS.fr);
  if (en + fr < 8) return undefined;
  if (en > fr * 1.5) return { code: "en", confidence: Math.round((en / (en + fr)) * 100) };
  if (fr > en * 1.5) return { code: "fr", confidence: Math.round((fr / (en + fr)) * 100) };
  return undefined;
}

// ───────────────────────────── page parsing ─────────────────────────────

/** A visible language-switcher control found on the page. */
interface SwitcherLink {
  code: string;
  href: string;
  /** The switcher's visible text, e.g. "العربية". */
  label?: string;
  /** Page region the switcher sits in. */
  location?: "header" | "navigation" | "footer";
}

interface ParsedPage {
  url: string;
  lang: string | undefined;
  dir: string | undefined;
  title: string | undefined;
  metaDescription: string | undefined;
  ogTitle: string | undefined;
  ogImage: string | undefined;
  canonical: string | undefined;
  h1: string | undefined;
  hreflangs: { tag: string; href: string }[];
  switcherLinks: SwitcherLink[];
  shortSnippets: string[];
  longSnippets: string[];
  formStrings: FormString[];
  uiStrings: UiString[];
  externalWidgets: ExternalWidget[];
  bodyText: string;
  imagesMissingAlt: number;
  formInputsMissingLabel: number;
  inlineCssHits: number;
  stylesheetUrls: string[];
}

const PHYSICAL_DIRECTION_REGEX = /\b(margin|padding)-left\s*:|(?<![-\w])left\s*:\s*\d|float\s*:\s*left|text-align\s*:\s*left/gi;

function countPhysicalDirectionHits(css: string): number {
  return (css.match(PHYSICAL_DIRECTION_REGEX) ?? []).length;
}

function hasLetters(text: string): boolean {
  return /\p{L}/u.test(text);
}

// ───────────────────────────── where an element sits ─────────────────────────────

type Cheerio$ = cheerio.CheerioAPI;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyNode = any;

/** Short, readable CSS selector for an element: up to 4 levels, stopping at the nearest id. */
function shortSelector($: Cheerio$, el: AnyNode): string {
  const parts: string[] = [];
  let node = el;
  while (node && node.type === "tag" && parts.length < 4) {
    const $n = $(node);
    const id = $n.attr("id");
    if (id && id.length <= 80 && !/\s/.test(id)) {
      parts.unshift(`${node.tagName}#${id}`);
      break;
    }
    const cls = ($n.attr("class") ?? "")
      .split(/\s+/)
      .find((c) => c && c.length <= 40 && !/\d{6,}|^(is-|js-)/.test(c));
    parts.unshift(cls ? `${node.tagName}.${cls}` : node.tagName);
    node = node.parent;
  }
  return parts.join(" > ");
}

/** "featured_collection_pEjPnp" → "Featured collection". */
function humanizeSectionId(raw: string): string {
  const parts = raw.split("_").filter(Boolean);
  if (parts.length > 1 && /^(?=.*[A-Z0-9])[A-Za-z0-9]{5,8}$/.test(parts[parts.length - 1])) parts.pop();
  const name = parts.join(" ").replace(/-/g, " ").trim();
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : raw;
}

const HIDDEN_CONTAINER_CLASS = /\b[\w-]*(drawer|modal|popup|pop-up|offcanvas|dropdown|mega-menu|megamenu|flyout)[\w-]*\b/i;

/** Page region, theme section, CSS selector and whether a visitor sees the element without interacting. */
function describeLocation($: Cheerio$, el: AnyNode, template?: AnyNode): IssueLocation {
  // Content of a <template> isn't attached to the page; describe where the template itself sits.
  const $el = template ? $(template) : $(el);
  const location: IssueLocation = { selector: shortSelector($, el), visibility: "visible" };

  if ($el.closest("[class*='announcement'], [id*='announcement']").length) location.region = "Announcement bar";
  else if ($el.closest("dialog, [role='dialog'], [aria-modal='true']").length) location.region = "Pop-up / dialog";
  else if ($el.closest("header, [role='banner']").length) location.region = "Header";
  else if ($el.closest("nav, [role='navigation']").length) location.region = "Navigation";
  else if ($el.closest("footer, [role='contentinfo']").length) location.region = "Footer";
  else if ($el.closest("main, [role='main']").length) location.region = "Main content";
  else if ($el.closest("aside").length) location.region = "Sidebar";

  const section = $el.closest("[id^='shopify-section-']").attr("id");
  if (section) {
    location.section = humanizeSectionId(section.replace(/^shopify-section-/, "").split("__").pop() ?? section);
  } else if ($el.closest(".shopify-app-block, [id^='shopify-block-']").length) {
    location.section = "App block";
  }

  const dialog = $el.closest("dialog");
  const hiddenAncestor = $el.closest("[hidden], [aria-hidden='true'], [style*='display:none'], [style*='display: none']");
  const details = $el.closest("details:not([open])");
  const container = $el
    .parents()
    .addBack()
    .filter((_, n) => HIDDEN_CONTAINER_CLASS.test($(n).attr("class") ?? ""))
    .first();
  if (template || $el.closest("body").length === 0) {
    const attrs = template ? Object.keys(template.attribs ?? {}).slice(0, 2).join(" ") : "";
    location.visibility = "script-rendered";
    location.visibilityNote = `Inside a <template${attrs ? ` ${attrs}` : ""}>: not on the page until a script inserts it (e.g. on scroll, on click, in the cart, or for logged-out visitors).`;
  } else if (dialog.length && dialog.attr("open") === undefined) {
    location.visibility = "hidden";
    location.visibilityNote = `Inside a closed dialog${dialog.attr("id") ? ` (#${dialog.attr("id")})` : ""}: shown only when it's opened.`;
  } else if (details.length && !$el.closest("summary").length) {
    location.visibility = "hidden";
    location.visibilityNote = "Inside a collapsed section: shown when it's expanded.";
  } else if (container.length) {
    location.visibility = "hidden";
    const m = (container.attr("class") ?? "").match(HIDDEN_CONTAINER_CLASS);
    location.visibilityNote = m
      ? `Inside a ${m[1].toLowerCase().replace("-", " ")} (.${m[0]}): shown on click or hover.`
      : "Inside a pop-up: shown on click or hover.";
  } else if (hiddenAncestor.length) {
    location.visibility = "hidden";
    location.visibilityNote = "Hidden by default (hidden / aria-hidden / display:none); a script may reveal it.";
  } else if ($el.closest(".visually-hidden, .sr-only").length) {
    location.visibility = "screen-reader";
    location.visibilityNote = "Visually hidden: read only by screen readers.";
  }
  return location;
}

/** Returns a locator for the page that maps <template> content back to its <template> element. */
function makeLocator($: Cheerio$): (el: AnyNode) => IssueLocation {
  const owner = new Map<AnyNode, AnyNode>();
  const walk = (node: AnyNode, tpl: AnyNode) => {
    for (const child of node.children ?? []) {
      if (!owner.has(child)) owner.set(child, tpl);
      walk(child, tpl);
    }
  };
  $("template").each((_, tpl) => walk(tpl, tpl));
  return (el) => describeLocation($, el, owner.get(el));
}

/** UI text that lives in attributes or form chrome, which the snippet/body checks never see. */
interface FormString {
  element: "placeholder" | "label" | "button";
  /** Human description of where the string sits, e.g. "placeholder". */
  kind: string;
  text: string;
  location: IssueLocation;
}

const FORM_STRING_KIND_LABEL: Record<string, string> = {
  placeholder: "Form placeholder",
  label: "Form label",
  "aria-label": "aria-label",
  submit: "Submit button",
};

/** Visible UI text (announcement bar, headings, buttons, badges, nav/footer links, short copy). */
interface UiString {
  element: ElementType;
  /** Human description of the page region, e.g. "Announcement bar". */
  region: string;
  text: string;
  location: IssueLocation;
  /** Contains the site's own name (e.g. a copyright line) — may be intentionally left in Latin script. */
  mentionsSiteName?: boolean;
}

// Checked in this order; a string is attributed to the first region that contains it.
const UI_REGIONS: { selector: string; region: string; element: ElementType }[] = [
  { selector: "[class*='announcement'], [id*='announcement']", region: "Announcement bar", element: "paragraph" },
  { selector: "h1, h2, h3, h4, h5, h6, [role='heading']", region: "Heading", element: "heading" },
  {
    selector: "button, [role='button'], a[class*='btn'], a[class*='button'], [class*='btn'], .cta",
    region: "Button",
    element: "button",
  },
  { selector: "[class*='badge'], [class*='tag'], [class*='label'], [class*='pill']", region: "Label", element: "label" },
  { selector: "header a, nav a, [role='navigation'] a", region: "Navigation", element: "nav-item" },
  { selector: "footer a, footer h2, footer h3, footer h4, footer p, footer li", region: "Footer", element: "link" },
  { selector: "p, li, dt, dd, summary, figcaption, [class*='title']", region: "Body", element: "paragraph" },
];

/** Classes that mark text which legitimately stays in its original script (brand, SKU, prices…). */
const UI_SKIP_CLASS = /vendor|brand|logo|sku|price|currency|money|payment|visually-hidden|sr-only/i;

/** Strings that are not translatable copy: emails, URLs, phone numbers, codes, units. */
function isNonTranslatableToken(text: string): boolean {
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(text)) return true;
  if (/^(https?:\/\/|www\.)\S+$/i.test(text)) return true;
  if (/^[+\d\s()./-]+$/.test(text)) return true;
  // Single all-caps / alphanumeric token: a coupon code, currency (SAR), size (XL).
  if (/^[A-Z0-9][A-Z0-9_-]*$/.test(text) && text.length <= 16) return true;
  return false;
}

const MAX_UI_STRING_ISSUES = 30;

/** A third-party app/widget that injects its own UI with JavaScript, so its text isn't in the fetched HTML. */
interface ExternalWidget {
  name: string;
  /** What the widget shows, e.g. "loyalty / rewards panel". */
  kind: string;
}

// Matched against script URLs and inline script text (Shopify apps often load via an inline asyncLoad list).
const KNOWN_WIDGETS: { name: string; kind: string; pattern: RegExp }[] = [
  { name: "Smile.io", kind: "loyalty / rewards panel", pattern: /smile-loader|smile\.io|sweettooth/i },
  { name: "Judge.me", kind: "product reviews widget", pattern: /judge\.me|\/judgeme[-/]/i },
  { name: "Yotpo", kind: "reviews / loyalty widget", pattern: /yotpo\.com/i },
  { name: "Loox", kind: "product reviews widget", pattern: /loox\.io/i },
  { name: "Stamped.io", kind: "product reviews widget", pattern: /stamped\.io/i },
  { name: "Okendo", kind: "product reviews widget", pattern: /okendo\.io/i },
  { name: "Klaviyo", kind: "sign-up forms / pop-ups", pattern: /klaviyo\.com/i },
  { name: "Privy", kind: "pop-ups / sign-up forms", pattern: /privy\.com/i },
  { name: "Omnisend", kind: "pop-ups / sign-up forms", pattern: /omnisend(cdn)?\.com|omnisrc\.com/i },
  { name: "Tidio", kind: "live chat", pattern: /tidio\.co/i },
  { name: "Intercom", kind: "live chat", pattern: /intercom(cdn)?\.(io|com)/i },
  { name: "Zendesk", kind: "live chat / help widget", pattern: /zdassets\.com|zopim/i },
  { name: "Gorgias", kind: "live chat", pattern: /gorgias\.(chat|io)/i },
  { name: "tawk.to", kind: "live chat", pattern: /tawk\.to/i },
  { name: "Crisp", kind: "live chat", pattern: /crisp\.chat/i },
  { name: "LiveChat", kind: "live chat", pattern: /livechatinc\.com/i },
  { name: "HubSpot", kind: "chat / forms", pattern: /hs-scripts\.com|hsforms\.net/i },
  { name: "Elfsight", kind: "embedded widget", pattern: /elfsight(cdn)?\.com/i },
  { name: "OneTrust", kind: "cookie consent banner", pattern: /onetrust\.com|cookielaw\.org/i },
  { name: "Cookiebot", kind: "cookie consent banner", pattern: /cookiebot\.com/i },
  { name: "Rebuy", kind: "upsell / recommendations widget", pattern: /rebuyengine\.com/i },
  { name: "Recharge", kind: "subscription widget", pattern: /rechargecdn\.com|rechargeapps\.com/i },
  { name: "GoAffPro", kind: "affiliate portal / widget", pattern: /goaffpro/i },
  { name: "HulkApps Form Builder", kind: "embedded forms", pattern: /form-builder-by-hulkapps/i },
];

/** Shopify theme app extensions: cdn.shopify.com/extensions/<uuid>/<handle>-<version>/assets/… */
function shopifyExtensionHandle(src: string): string | undefined {
  const m = src.match(/cdn\.shopify\.com\/extensions\/[\w-]+\/([a-z][\w-]*?)(?:-\d+(?:\.\d+)*)?\/assets\//i);
  return m ? m[1] : undefined;
}

function detectExternalWidgets($: cheerio.CheerioAPI): ExternalWidget[] {
  const srcs = $("script[src], iframe[src]")
    .map((_, el) => $(el).attr("src") ?? "")
    .get();
  const inline = $("script:not([src])")
    .map((_, el) => $(el).html() ?? "")
    .get()
    .join("\n")
    .split("\\/")
    .join("/");
  const haystack = `${srcs.join("\n")}\n${inline}`;

  const found = new Map<string, ExternalWidget>();
  for (const w of KNOWN_WIDGETS) {
    if (w.pattern.test(haystack)) found.set(w.name, { name: w.name, kind: w.kind });
  }
  // Any other Shopify app extension that ships a storefront script.
  for (const src of srcs) {
    const handle = shopifyExtensionHandle(src);
    if (!handle || KNOWN_WIDGETS.some((w) => w.pattern.test(src))) continue;
    const name = handle
      .replace(/[-_]+/g, " ")
      .replace(/(\s+\d+)+$/, "")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    if (!found.has(name)) found.set(name, { name, kind: "Shopify app widget" });
  }
  return Array.from(found.values());
}

/** Short Title-Case text with no common English words — often a brand or product name. */
function isLikelyName(text: string): boolean {
  const words = text.split(/\s+/);
  if (words.length > 4 || /[?!:.]$/.test(text)) return false;
  if (words.some((w) => STOPWORDS.en.includes(w.toLowerCase()))) return false;
  return words.every((w) => /^[A-Z0-9]/.test(w) || /^[-–|&x]$/.test(w));
}

/** Latin letters but nothing in the Hebrew/Arabic blocks — i.e. left in a Latin-script source language. */
function isLatinOnlyText(text: string): boolean {
  return /[A-Za-zÀ-ÿ]/.test(text) && !/[֐-ࣿ]/.test(text);
}

function parsePage(html: string, pageUrl: URL): ParsedPage {
  const $ = cheerio.load(html);

  const lang = $("html").attr("lang")?.trim() || undefined;
  const dir = ($("html").attr("dir") ?? $("body").attr("dir"))?.trim().toLowerCase() || undefined;
  const title = $("title").first().text().trim().replace(/\s+/g, " ") || undefined;
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() || undefined;
  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || undefined;
  const ogImage = $('meta[property="og:image"]').attr("content")?.trim() || undefined;
  const canonical = $('link[rel="canonical"]').attr("href")?.trim() || undefined;
  const h1 = $("h1").first().text().trim().replace(/\s+/g, " ") || undefined;

  const hreflangs: { tag: string; href: string }[] = [];
  $('link[rel="alternate"][hreflang]').each((_, el) => {
    const tag = $(el).attr("hreflang")?.trim();
    const href = $(el).attr("href")?.trim();
    if (!tag || !href) return;
    try {
      hreflangs.push({ tag, href: new URL(href, pageUrl).toString() });
    } catch {
      // ignore malformed hrefs
    }
  });

  // Language-switcher links: an <a> that names a language and points at another URL.
  const switcher = new Map<string, SwitcherLink>();
  $("a[href]").each((_, el) => {
    const $a = $(el);
    const rawHref = $a.attr("href")?.trim();
    if (!rawHref || rawHref.startsWith("#") || /^(javascript|mailto|tel):/i.test(rawHref)) return;
    let abs: URL;
    try {
      abs = new URL(rawHref, pageUrl);
    } catch {
      return;
    }
    if (abs.protocol !== "http:" && abs.protocol !== "https:") return;
    abs.hash = "";
    if (abs.toString() === pageUrl.toString()) return;

    const hreflangAttr = $a.attr("hreflang");
    const visibleText = $a.text().trim().replace(/\s+/g, " ");
    let code: string | undefined;
    if (hreflangAttr && hreflangAttr.toLowerCase() !== "x-default") {
      code = baseLanguageCode(hreflangAttr);
    } else {
      const text = visibleText || $a.attr("aria-label") || $a.attr("title") || "";
      const langAttr = $a.attr("lang");
      const candidate = (langAttr ? baseLanguageCode(langAttr) : undefined) ?? codeFromLabel(text);
      if (candidate) {
        const inLanguageContext =
          $a
            .parents()
            .addBack()
            .filter((_, node) =>
              /lang|locale|i18n|translat/i.test(
                `${$(node).attr("class") ?? ""} ${$(node).attr("id") ?? ""} ${$(node).attr("aria-label") ?? ""}`
              )
            ).length > 0;
        if (inLanguageContext || urlHintCode(abs) === candidate) code = candidate;
      }
    }
    if (code && /^[a-z]{2,3}$/.test(code) && !switcher.has(code) && switcher.size < 12) {
      const label = (visibleText || $a.attr("aria-label") || $a.attr("title") || "").trim().slice(0, 60) || undefined;
      const location = $a.closest("header, [role='banner']").length
        ? "header"
        : $a.closest("footer, [role='contentinfo']").length
          ? "footer"
          : $a.closest("nav, [role='navigation']").length
            ? "navigation"
            : undefined;
      switcher.set(code, { code, href: abs.toString(), label, location });
    }
  });

  const seenShort = new Set<string>();
  const shortSnippets: string[] = [];
  $("button, nav a, header a, [class*='btn'], [class*='button'], .cta").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    // Language names in the switcher are the same on every version by design — not a translation gap.
    if (text.length < 2 || text.length > 40 || !hasLetters(text) || codeFromLabel(text) || seenShort.has(text)) return;
    seenShort.add(text);
    shortSnippets.push(text);
  });

  const seenLong = new Set<string>();
  const longSnippets: string[] = [];
  $("p").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text.length < 40 || text.length > 220 || seenLong.has(text)) return;
    seenLong.add(text);
    longSnippets.push(text);
  });

  const locate = makeLocator($);
  const seenForm = new Set<string>();
  const formStrings: FormString[] = [];
  const pushForm = (el: AnyNode, element: FormString["element"], kind: string, raw: string | undefined) => {
    const text = raw?.trim().replace(/\s+/g, " ") ?? "";
    if (text.length < 2 || text.length > 80 || !hasLetters(text) || codeFromLabel(text) || seenForm.has(text)) return;
    seenForm.add(text);
    formStrings.push({ element, kind, text, location: locate(el) });
  };
  $("input[placeholder]:not([type='hidden']), textarea[placeholder]").each((_, el) => {
    pushForm(el, "placeholder", "placeholder", $(el).attr("placeholder"));
  });
  $("label").each((_, el) => pushForm(el, "label", "label", $(el).text()));
  $("[aria-label]").each((_, el) => pushForm(el, "label", "aria-label", $(el).attr("aria-label")));
  $("button[type='submit'], form button:not([type])").each((_, el) => pushForm(el, "button", "submit", $(el).text()));
  $("input[type='submit'], input[type='button']").each((_, el) => pushForm(el, "button", "submit", $(el).attr("value")));

  // Visible UI copy. Collected on every page; the scan decides which strings are out of place.
  const siteName = $('meta[property="og:site_name"]').attr("content")?.trim().toLowerCase();
  const seenUi = new Set<string>();
  const uiStrings: UiString[] = [];
  for (const { selector, region, element } of UI_REGIONS) {
    $(selector).each((_, el) => {
      const $el = $(el);
      if ($el.closest("script, style, noscript, template, svg").length) return;
      if ($el.parents().addBack().filter((_, n) => UI_SKIP_CLASS.test($(n).attr("class") ?? "")).length) return;
      const text = $el.text().trim().replace(/\s+/g, " ");
      if (text.length < 2 || text.length > 120 || !hasLetters(text)) return;
      const key = text.toLowerCase();
      if (seenUi.has(key)) return;
      seenUi.add(key);
      if (codeFromLabel(text) || isNonTranslatableToken(text)) return;
      // The site's own name (alone or in "© 2026 Brand.") is reported, but as a possible intentional brand spelling.
      const mentionsSiteName = Boolean(siteName && key.includes(siteName));
      uiStrings.push({ element, region, text, mentionsSiteName, location: locate(el) });
    });
  }

  const externalWidgets = detectExternalWidgets($);

  let imagesMissingAlt = 0;
  $("img").each((_, el) => {
    const alt = $(el).attr("alt");
    if (alt === undefined || alt.trim() === "") imagesMissingAlt += 1;
  });

  let formInputsMissingLabel = 0;
  $("input[type='text'], input[type='email'], input[type='search'], input:not([type]), textarea").each((_, el) => {
    const id = $(el).attr("id");
    const hasLabel = Boolean($(el).attr("aria-label") || $(el).attr("aria-labelledby")) || (id && $(`label[for="${id}"]`).length > 0);
    if (!hasLabel) formInputsMissingLabel += 1;
  });

  const inlineCss = `${$("style").text()}\n${$("[style]")
    .map((_, el) => $(el).attr("style"))
    .get()
    .join("\n")}`;

  const stylesheetUrls: string[] = [];
  $('link[rel="stylesheet"][href]').each((_, el) => {
    try {
      stylesheetUrls.push(new URL($(el).attr("href") ?? "", pageUrl).toString());
    } catch {
      // ignore malformed hrefs
    }
  });

  $("script, style, noscript, svg").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();

  return {
    url: pageUrl.toString(),
    lang,
    dir,
    title,
    metaDescription,
    ogTitle,
    ogImage,
    canonical,
    h1,
    hreflangs,
    switcherLinks: Array.from(switcher.values()),
    shortSnippets,
    longSnippets,
    formStrings,
    uiStrings,
    externalWidgets,
    bodyText,
    imagesMissingAlt,
    formInputsMissingLabel,
    inlineCssHits: countPhysicalDirectionHits(inlineCss),
    stylesheetUrls,
  };
}

// ───────────────────────────── result types ─────────────────────────────

export type IssueDraft = Omit<Issue, "id" | "scanId" | "websiteId" | "createdAt" | "status">;
export type PageDraft = Omit<PageRecord, "id" | "scanId" | "websiteId">;

export interface ScanResult {
  pageUrl: string;
  declaredLang: string | undefined;
  detectedLanguages: DetectedLanguage[];
  pages: PageDraft[];
  issues: IssueDraft[];
  hreflang: HreflangEntry[];
  routing: RouteMapping[];
  /** Selected-page vs. alternate comparison, keyed by the alternate's language code. */
  comparisons: Record<string, ComparisonPair[]>;
  translationsChecked: number;
}

function displayPath(url: URL, baseHost: string): string {
  const path = `${url.pathname.length > 1 && url.pathname.endsWith("/") ? url.pathname.slice(0, -1) : url.pathname}${url.search}`;
  return url.host === baseHost ? path : `${url.host}${path}`;
}

/** URL with the language marker (locale path segment, locale subdomain, ?lang=) removed. */
function localeNeutralKey(url: URL, codes: Set<string>): string {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length > 0 && codes.has(baseLanguageCode(segments[0]))) segments.shift();
  const labels = url.hostname.replace(/^www\./, "").split(".");
  if (labels.length > 2 && codes.has(labels[0].toLowerCase())) labels.shift();
  const params = new URLSearchParams(url.search);
  for (const key of ["lang", "locale", "hl", "language"]) params.delete(key);
  return `${labels.join(".")}/${segments.join("/")}?${params.toString()}`;
}

function classifyPair(source: string | undefined, target: string | undefined): ComparisonPair["status"] | undefined {
  if (!source && !target) return undefined;
  if (source && !target) return "missing";
  if (!source && target) return "extra";
  if (source && target && hasLetters(source) && source.trim().toLowerCase() === target.trim().toLowerCase()) {
    return "suspicious-identical";
  }
  return "ok";
}

function buildComparison(code: string, selected: ParsedPage, alt: ParsedPage): ComparisonPair[] {
  const pairs: ComparisonPair[] = [];
  const push = (key: string, source: string | undefined, target: string | undefined) => {
    const status = classifyPair(source, target);
    if (status) pairs.push({ id: `${code}-${pairs.length}`, key, sourceText: source ?? "", targetText: target ?? "", status });
  };

  push("Page title", selected.title, alt.title);
  push("Meta description", selected.metaDescription, alt.metaDescription);
  push("Main heading", selected.h1, alt.h1);
  // Template-driven pages keep the same structure across languages, so positional pairing is a fair approximation.
  for (let i = 0; i < Math.min(8, Math.max(selected.shortSnippets.length, alt.shortSnippets.length)); i++) {
    push("Button / link", selected.shortSnippets[i], alt.shortSnippets[i]);
  }
  for (let i = 0; i < Math.min(4, Math.max(selected.longSnippets.length, alt.longSnippets.length)); i++) {
    push("Body copy", selected.longSnippets[i], alt.longSnippets[i]);
  }
  return pairs;
}

const PAIR_ELEMENT: Record<string, { element: NonNullable<Issue["element"]>; severity: Issue["severity"]; confidence: number; priority: number }> = {
  "Body copy": { element: "paragraph", severity: "warning", confidence: 90, priority: 0 },
  "Meta description": { element: "meta-description", severity: "warning", confidence: 85, priority: 1 },
  "Main heading": { element: "heading", severity: "warning", confidence: 80, priority: 2 },
  "Page title": { element: "meta-title", severity: "info", confidence: 70, priority: 3 },
  "Button / link": { element: "button", severity: "info", confidence: 70, priority: 4 },
};

async function countStylesheetHits(urls: string[], cache: Map<string, number>): Promise<number> {
  let hits = 0;
  for (const href of urls.slice(0, MAX_STYLESHEETS_PER_PAGE)) {
    const cached = cache.get(href);
    if (cached !== undefined) {
      hits += cached;
      continue;
    }
    let count = 0;
    try {
      assertPubliclyFetchable(new URL(href));
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(href, { signal: controller.signal, headers: { "User-Agent": USER_AGENT } });
      clearTimeout(timeout);
      if (res.ok) count = countPhysicalDirectionHits((await res.text()).slice(0, MAX_STYLESHEET_BYTES));
    } catch {
      // A single unreachable stylesheet shouldn't sink the scan.
    }
    cache.set(href, count);
    hits += count;
  }
  return hits;
}

// ───────────────────────────── the scan ─────────────────────────────

interface AnalyzedVersion {
  code: LanguageCode;
  parsed: ParsedPage;
  url: URL;
  path: string;
  isSelected: boolean;
}

export async function scanPage(params: { url: string; language: LanguageCode }): Promise<ScanResult> {
  const normalized = normalizePageUrl(params.url);
  if (!normalized) throw new ScanError("Enter a valid page URL, for example https://example.com/about.");

  const selectedLang = getLanguage(params.language);
  const { html, finalUrl } = await fetchHtml(normalized.url);
  const pageUrl = new URL(finalUrl);
  const selectedParsed = parsePage(html, pageUrl);
  const baseHost = pageUrl.host;
  const selectedPath = displayPath(pageUrl, baseHost);

  const issues: IssueDraft[] = [];
  const addIssue = (issue: IssueDraft) => issues.push(issue);

  // 1. Which other languages does this page point to?
  interface Candidate {
    code: string;
    tag: string;
    url: URL;
    sources: Set<LanguageSource>;
  }
  const candidates = new Map<string, Candidate>();
  const addCandidate = (tag: string, href: string, source: LanguageSource) => {
    const code = baseLanguageCode(tag);
    if (!/^[a-z]{2,3}$/.test(code) || code === selectedLang.code) return;
    const existing = candidates.get(code);
    if (existing) {
      existing.sources.add(source);
      return;
    }
    try {
      const url = new URL(href, pageUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      url.hash = "";
      candidates.set(code, { code, tag, url, sources: new Set([source]) });
    } catch {
      // ignore malformed hrefs
    }
  };
  for (const h of selectedParsed.hreflangs) addCandidate(h.tag, h.href, "hreflang");
  for (const l of selectedParsed.switcherLinks) addCandidate(l.code, l.href, "link");
  const switcherByCode = new Map(
    selectedParsed.switcherLinks.map((l): [string, LanguageSwitcher] => [
      l.code,
      { label: l.label, location: l.location, href: l.href },
    ])
  );

  // 2. Fetch the language versions the checker can compare — the selectable languages (EN/AR/FR)
  // first, then other supported ones — capped so a page with dozens of locales stays fast.
  const priority = (code: string) => {
    const selectable = SELECTABLE_LANGUAGES.findIndex((l) => l.code === code);
    if (selectable >= 0) return selectable;
    return isCatalogCode(code) ? SELECTABLE_LANGUAGES.length : SELECTABLE_LANGUAGES.length + 1;
  };
  const ordered = Array.from(candidates.values()).sort((a, b) => priority(a.code) - priority(b.code));
  const toFetch = ordered.filter((c) => isCatalogCode(c.code) && c.url.toString() !== pageUrl.toString()).slice(0, MAX_ALTERNATES);
  const fetched = await Promise.allSettled(toFetch.map((c) => fetchHtml(c.url.toString())));

  const versions: AnalyzedVersion[] = [
    { code: selectedLang.code, parsed: selectedParsed, url: pageUrl, path: selectedPath, isSelected: true },
  ];
  const detectedLanguages: DetectedLanguage[] = [
    {
      code: selectedLang.code,
      tag: selectedParsed.lang ?? selectedLang.code,
      name: selectedLang.name,
      direction: selectedLang.direction,
      url: pageUrl.toString(),
      sources: ["selected"],
      status: "selected",
    },
  ];
  const unreachable: { code: LanguageCode; url: URL; reason: string }[] = [];

  for (const candidate of ordered) {
    const info = describeLanguage(candidate.tag);
    const base = {
      code: candidate.code,
      tag: candidate.tag,
      name: info.name,
      direction: info.direction,
      url: candidate.url.toString(),
      sources: Array.from(candidate.sources),
      switcher: switcherByCode.get(candidate.code),
    };
    const fetchIndex = toFetch.indexOf(candidate);
    if (fetchIndex === -1) {
      const note = !isCatalogCode(candidate.code)
        ? "Detected, but the checker can't compare this language yet."
        : candidate.url.toString() === pageUrl.toString()
          ? "Points back to the selected page, so there is nothing to compare."
          : `Skipped — only the first ${MAX_ALTERNATES} language versions are compared per scan.`;
      detectedLanguages.push({ ...base, status: "not-analyzed", note });
      continue;
    }
    const outcome = fetched[fetchIndex];
    if (outcome.status === "rejected") {
      const reason = outcome.reason instanceof Error ? outcome.reason.message : "The page could not be loaded.";
      detectedLanguages.push({ ...base, status: "unreachable", note: reason });
      unreachable.push({ code: candidate.code as LanguageCode, url: candidate.url, reason });
      continue;
    }
    const altUrl = new URL(outcome.value.finalUrl);
    versions.push({
      code: candidate.code as LanguageCode,
      parsed: parsePage(outcome.value.html, altUrl),
      url: altUrl,
      path: displayPath(altUrl, baseHost),
      isSelected: false,
    });
    detectedLanguages.push({ ...base, status: "analyzed" });
  }

  const alternates = versions.filter((v) => !v.isSelected);
  const stylesheetCache = new Map<string, number>();
  const rtlHits = new Map<string, number>();

  // 3. Findings about the language versions as a set.
  if (candidates.size === 0) {
    addIssue({
      category: "translation",
      severity: "warning",
      page: selectedPath,
      url: pageUrl.toString(),
      message: "No other language versions were detected on this page.",
      translationType: "missing-page",
      sourceLanguage: selectedLang.code,
      suggestedAction:
        'Add <link rel="alternate" hreflang="..."> tags and a visible language switcher so each language version can be discovered.',
    });
  }

  if (selectedParsed.hreflangs.length === 0 && selectedParsed.switcherLinks.length > 0) {
    addIssue({
      category: "seo",
      severity: "warning",
      page: selectedPath,
      url: pageUrl.toString(),
      message: "The page links to other languages but has no hreflang annotations.",
      suggestedAction: `Add <link rel="alternate" hreflang="..."> tags for ${selectedLang.code} and each linked language.`,
    });
  } else if (
    selectedParsed.hreflangs.length > 0 &&
    !selectedParsed.hreflangs.some((h) => baseLanguageCode(h.tag) === selectedLang.code)
  ) {
    addIssue({
      category: "seo",
      severity: "info",
      page: selectedPath,
      url: pageUrl.toString(),
      message: `The page's hreflang set has no self-referencing "${selectedLang.code}" entry.`,
      suggestedAction: `Include <link rel="alternate" hreflang="${selectedLang.code}"> pointing at this page.`,
    });
  }

  for (const miss of unreachable) {
    const name = getLanguage(miss.code).name;
    addIssue({
      category: "translation",
      severity: "critical",
      page: selectedPath,
      url: miss.url.toString(),
      message: `The ${name} version could not be loaded: ${miss.reason}`,
      translationType: "missing-page",
      sourceLanguage: selectedLang.code,
      targetLanguage: miss.code,
      suggestedAction: `Check that ${miss.url.toString()} exists, or fix the hreflang / language-switcher link that points to it.`,
    });
  }

  // 4. Per-version checks.
  const codesInPlay = new Set<string>(versions.map((v) => v.code).concat(unreachable.map((u) => u.code)));
  const selectedKey = localeNeutralKey(pageUrl, codesInPlay);

  // Where to read the "source" wording of a string found on a version: for the selected page, the English
  // (or first left-to-right) version; for any other version, the selected page.
  const referenceFor = (version: AnalyzedVersion): AnalyzedVersion | undefined =>
    version.isSelected
      ? (alternates.find((a) => a.code === "en") ?? alternates.find((a) => getLanguage(a.code).direction === "ltr"))
      : versions[0];
  /** The same string on the reference version: identical text first, else the element at a unique matching selector. */
  const sourceTextFor = (
    ref: AnalyzedVersion | undefined,
    pick: (parsed: ParsedPage) => { text: string; location: IssueLocation }[],
    item: { text: string; location: IssueLocation },
    from: ParsedPage
  ): string | undefined => {
    if (!ref) return undefined;
    const refItems = pick(ref.parsed);
    const same = refItems.find((r) => r.text.toLowerCase() === item.text.toLowerCase());
    if (same) return same.text;
    const selector = item.location.selector;
    if (!selector) return undefined;
    const atSelector = refItems.filter((r) => r.location.selector === selector);
    const unique = pick(from).filter((r) => r.location.selector === selector).length === 1;
    return atSelector.length === 1 && unique ? atSelector[0].text : undefined;
  };

  for (const version of versions) {
    const lang = getLanguage(version.code);
    const p = version.parsed;
    const ref = referenceFor(version);
    const here = { page: version.path, url: version.url.toString() };
    const who = version.isSelected ? "The selected page" : `The ${lang.name} version`;

    if (!p.lang) {
      addIssue({
        category: "seo",
        severity: "warning",
        ...here,
        message: `${who} has no lang attribute on <html>.`,
        suggestedAction: `Add lang="${lang.code}" to the <html> element.`,
      });
    } else if (baseLanguageCode(p.lang) !== lang.code) {
      addIssue({
        category: "seo",
        severity: version.isSelected ? "warning" : "critical",
        ...here,
        message: version.isSelected
          ? `You selected ${lang.name}, but the page declares lang="${p.lang}".`
          : `The ${lang.name} version declares lang="${p.lang}".`,
        suggestedAction: `Set lang="${lang.code}" on <html> so browsers, screen readers and search engines treat the page as ${lang.name}.`,
      });
    }

    const detected = detectContentLanguage(p.bodyText);
    if (detected && (lang.code === "en" || lang.code === "ar" || lang.code === "fr") && detected.code !== lang.code) {
      const detectedName = getLanguage(detected.code).name;
      addIssue({
        category: "translation",
        severity: version.isSelected ? "warning" : "critical",
        ...here,
        message: version.isSelected
          ? `You selected ${lang.name}, but the page text looks like ${detectedName}.`
          : `The ${lang.name} version's text looks like ${detectedName}, not ${lang.name}.`,
        translationType: "untranslated-text",
        sourceLanguage: selectedLang.code,
        targetLanguage: version.isSelected ? undefined : lang.code,
        confidence: detected.confidence,
        suggestedAction: version.isSelected
          ? "Pick the language the page is actually written in, or fix the page content."
          : `Translate the page content into ${lang.name}.`,
      });
    }

    if (!p.title) {
      addIssue({
        category: version.isSelected ? "seo" : "translation",
        severity: "critical",
        ...here,
        element: "meta-title",
        message: `${who} has no <title>.`,
        translationType: version.isSelected ? undefined : "missing-metadata",
        sourceLanguage: selectedLang.code,
        targetLanguage: version.isSelected ? undefined : lang.code,
        suggestedAction: "Add a descriptive <title> tag.",
      });
    }
    if (!p.metaDescription && (version.isSelected || selectedParsed.metaDescription)) {
      addIssue({
        category: version.isSelected ? "seo" : "translation",
        severity: "warning",
        ...here,
        element: "meta-description",
        message: `${who} has no meta description.`,
        translationType: version.isSelected ? undefined : "missing-metadata",
        sourceLanguage: selectedLang.code,
        targetLanguage: version.isSelected ? undefined : lang.code,
        sourceText: version.isSelected ? undefined : selectedParsed.metaDescription,
        suggestedAction: "Add a meta description so search results show a snippet in the right language.",
      });
    }
    if (!p.canonical) {
      addIssue({
        category: "seo",
        severity: "warning",
        ...here,
        message: `${who} has no canonical link.`,
        suggestedAction: `Add <link rel="canonical" href="${version.url.toString()}">.`,
      });
    }
    if (version.isSelected && (!p.ogTitle || !p.ogImage)) {
      addIssue({
        category: "seo",
        severity: "info",
        ...here,
        element: "og-tag",
        message: `${who} is missing Open Graph ${!p.ogTitle && !p.ogImage ? "title and image" : !p.ogTitle ? "title" : "image"} tags.`,
        suggestedAction: "Add og:title and og:image so shared links render correctly.",
      });
    }
    if (!version.isSelected && !p.hreflangs.some((h) => baseLanguageCode(h.tag) === selectedLang.code)) {
      addIssue({
        category: "seo",
        severity: "warning",
        ...here,
        message: `The ${lang.name} version has no hreflang link back to ${selectedLang.name}.`,
        suggestedAction: `Add <link rel="alternate" hreflang="${selectedLang.code}" href="${pageUrl.toString()}"> — hreflang annotations must be reciprocal.`,
      });
    }

    if (lang.direction === "rtl") {
      const hits = p.inlineCssHits + (await countStylesheetHits(p.stylesheetUrls, stylesheetCache));
      rtlHits.set(version.url.toString(), hits);
      if (p.dir !== "rtl") {
        addIssue({
          category: "rtl",
          severity: "critical",
          ...here,
          message: `${who} (${lang.name}) does not set dir="rtl".`,
          rtlAspect: "direction",
          suggestedAction: 'Set dir="rtl" on the <html> element for right-to-left languages.',
        });
      }
      if (hits > 0) {
        addIssue({
          category: "rtl",
          severity: hits > 6 ? "critical" : "warning",
          ...here,
          message: `${hits} physical-direction CSS declarations (left/right) found that won't flip under RTL.`,
          rtlAspect: "layout",
          cssCurrent: "margin-left: 24px;",
          cssSuggested: "margin-inline-start: 24px;",
          suggestedAction: "Replace left/right properties with their logical (inline-start / inline-end) equivalents.",
        });
      }
    } else if (p.dir === "rtl") {
      addIssue({
        category: "rtl",
        severity: "warning",
        ...here,
        message: `${who} is ${lang.name} (left-to-right) but sets dir="rtl".`,
        rtlAspect: "direction",
        suggestedAction: 'Remove dir="rtl" or set dir="ltr" for left-to-right languages.',
      });
    }

    if (p.imagesMissingAlt > 0) {
      addIssue({
        category: "accessibility",
        severity: "warning",
        ...here,
        element: "alt-text",
        message: `${p.imagesMissingAlt} image${p.imagesMissingAlt === 1 ? "" : "s"} on ${version.isSelected ? "the selected page" : `the ${lang.name} version`} ${p.imagesMissingAlt === 1 ? "has" : "have"} no alt text.`,
        suggestedAction: "Add descriptive alt text, written in the page's language.",
      });
    }
    if (p.formInputsMissingLabel > 0) {
      addIssue({
        category: "accessibility",
        severity: "warning",
        ...here,
        element: "label",
        message: `${p.formInputsMissingLabel} form input${p.formInputsMissingLabel === 1 ? "" : "s"} on ${version.isSelected ? "the selected page" : `the ${lang.name} version`} ${p.formInputsMissingLabel === 1 ? "has" : "have"} no associated label.`,
        suggestedAction: "Add <label for> elements or aria-label attributes.",
      });
    }

    // Placeholders, labels, aria-labels and submit buttons are often hardcoded in theme templates and
    // missed by translation apps. Flag them when they're Latin-only on an RTL page, or identical to the
    // selected page's string in another language.
    // Latin-only strings on an RTL selected page are themselves untranslated (reported there), not source copy.
    const selectedFormTexts = new Set(
      selectedParsed.formStrings
        .filter((f) => !(selectedLang.direction === "rtl" && isLatinOnlyText(f.text)))
        .map((f) => f.text.toLowerCase())
    );
    const untranslatedForm = p.formStrings
      .filter((f) => {
        if (lang.direction === "rtl" && isLatinOnlyText(f.text)) return true;
        return !version.isSelected && lang.code !== selectedLang.code && selectedFormTexts.has(f.text.toLowerCase());
      })
      .slice(0, 12);
    for (const f of untranslatedForm) {
      const matchesSource = !version.isSelected && selectedFormTexts.has(f.text.toLowerCase());
      const sourceText = sourceTextFor(ref, (x) => x.formStrings, f, p);
      addIssue({
        category: "translation",
        severity: "warning",
        ...here,
        element: f.element,
        location: f.location,
        message: `${FORM_STRING_KIND_LABEL[f.kind]} "${f.text}" is not translated on ${version.isSelected ? "the selected page" : `the ${lang.name} version`}.`,
        translationType: "untranslated-text",
        sourceLanguage: ref?.code ?? selectedLang.code,
        targetLanguage: lang.code,
        sourceText,
        targetText: f.text,
        confidence: matchesSource || sourceText?.toLowerCase() === f.text.toLowerCase() ? 90 : 75,
        suggestedAction: `Translate this ${f.kind} into ${lang.name} (check the theme's locale file or the form's template), or confirm it's intentionally unchanged.`,
      });
    }

    // Visible UI copy (announcement bar, headings, buttons, badges, nav/footer, short text) left in a
    // Latin-script language on a right-to-left page. Skips strings already reported as form chrome.
    if (lang.direction === "rtl") {
      const reportedForm = new Set(untranslatedForm.map((f) => f.text.toLowerCase()));
      const latinUi = p.uiStrings.filter((u) => isLatinOnlyText(u.text) && !reportedForm.has(u.text.toLowerCase()));
      for (const u of latinUi.slice(0, MAX_UI_STRING_ISSUES)) {
        const looksLikeName = u.mentionsSiteName || isLikelyName(u.text);
        const sourceText = sourceTextFor(ref, (x) => x.uiStrings, u, p);
        addIssue({
          category: "translation",
          severity: looksLikeName ? "info" : "warning",
          ...here,
          element: u.element,
          location: u.location,
          message: `${u.region} text "${u.text}" is not translated on ${version.isSelected ? "the selected page" : `the ${lang.name} version`}.`,
          translationType: "untranslated-text",
          sourceLanguage: ref?.code ?? selectedLang.code,
          targetLanguage: lang.code,
          sourceText,
          targetText: u.text,
          // Same wording on the other language version confirms it was never translated.
          confidence: sourceText?.toLowerCase() === u.text.toLowerCase() ? (looksLikeName ? 65 : 95) : looksLikeName ? 55 : 85,
          suggestedAction: looksLikeName
            ? `Translate this into ${lang.name}, or confirm it's a brand or product name that intentionally stays in Latin script.`
            : `Translate this into ${lang.name} (check the theme's locale file, section settings or translation app).`,
        });
      }
      if (latinUi.length > MAX_UI_STRING_ISSUES) {
        addIssue({
          category: "translation",
          severity: "warning",
          ...here,
          message: `${latinUi.length - MAX_UI_STRING_ISSUES} more untranslated UI strings on ${version.isSelected ? "the selected page" : `the ${lang.name} version`} were not listed individually.`,
          translationType: "untranslated-text",
          sourceLanguage: selectedLang.code,
          targetLanguage: version.isSelected ? undefined : lang.code,
          suggestedAction: `Review the page's templates for remaining hardcoded text that isn't in ${lang.name}.`,
        });
      }
    }

    // Third-party widgets render their own text in the browser; flag them once so they're checked by hand.
    const widgetsHere = version.isSelected
      ? p.externalWidgets
      : p.externalWidgets.filter((w) => !selectedParsed.externalWidgets.some((s) => s.name === w.name));
    for (const w of widgetsHere) {
      addIssue({
        category: "translation",
        severity: "info",
        ...here,
        location: { region: "Injected by a third-party script", visibility: "script-rendered" },
        message: `${w.name} (${w.kind}) adds content with JavaScript after the page loads, so its text wasn't checked.`,
        translationType: "untranslated-text",
        sourceLanguage: selectedLang.code,
        targetLanguage: version.isSelected ? undefined : lang.code,
        suggestedAction: `Open the page in ${lang.name} and check this widget's text. Most apps have their own language/translation settings in the app's admin.`,
      });
    }
  }

  // 5. Selected page vs. each language version.
  const comparisons: Record<string, ComparisonPair[]> = {};
  const translationScores = new Map<string, number>();
  let translationsChecked = 0;
  const routeMismatches: AnalyzedVersion[] = [];

  for (const alt of alternates) {
    const lang = getLanguage(alt.code);
    const pairs = buildComparison(alt.code, selectedParsed, alt.parsed);
    comparisons[alt.code] = pairs;
    translationsChecked += pairs.length;
    translationScores.set(alt.code, pairs.length === 0 ? 100 : Math.round((pairs.filter((x) => x.status === "ok").length / pairs.length) * 100));

    const identical = pairs
      .filter((x) => x.status === "suspicious-identical" && PAIR_ELEMENT[x.key])
      .sort((a, b) => PAIR_ELEMENT[a.key].priority - PAIR_ELEMENT[b.key].priority)
      .slice(0, 6);
    for (const pair of identical) {
      const meta = PAIR_ELEMENT[pair.key];
      addIssue({
        category: "translation",
        severity: meta.severity,
        page: alt.path,
        url: alt.url.toString(),
        element: meta.element,
        message:
          pair.key === "Body copy"
            ? `Paragraph copy appears untranslated on the ${lang.name} version.`
            : `${pair.key} is identical in ${selectedLang.name} and ${lang.name}.`,
        translationType: pair.key === "Body copy" ? "untranslated-text" : "identical-translation",
        sourceLanguage: selectedLang.code,
        targetLanguage: alt.code,
        sourceText: pair.sourceText,
        targetText: pair.targetText,
        confidence: meta.confidence,
        suggestedAction: `Translate this into ${lang.name}, or confirm it's intentionally unchanged (brand names often are).`,
      });
    }
    const missingHeading = pairs.find((x) => x.key === "Main heading" && x.status === "missing");
    if (missingHeading) {
      addIssue({
        category: "translation",
        severity: "warning",
        page: alt.path,
        url: alt.url.toString(),
        element: "heading",
        message: `The ${lang.name} version has no main heading (h1).`,
        translationType: "missing-translation",
        sourceLanguage: selectedLang.code,
        targetLanguage: alt.code,
        sourceText: missingHeading.sourceText,
        targetText: "",
        suggestedAction: `Add an ${lang.name} h1 heading.`,
      });
    }

    if (localeNeutralKey(alt.url, codesInPlay) !== selectedKey) routeMismatches.push(alt);
  }

  for (const alt of routeMismatches) {
    addIssue({
      category: "routing",
      severity: "warning",
      page: alt.path,
      url: alt.url.toString(),
      message: `Localized URL structure differs: ${selectedPath} vs ${alt.path}.`,
      suggestedAction: "Use one consistent URL pattern across languages (for example a locale prefix such as /ar/...).",
    });
  }

  // 6. Tables for the other tabs.
  const hreflang: HreflangEntry[] = versions.map((v) => ({
    path: v.path,
    lang: v.code,
    hreflangOk: v.isSelected
      ? v.parsed.hreflangs.length > 0
      : v.parsed.hreflangs.some((h) => baseLanguageCode(h.tag) === selectedLang.code),
    canonicalOk: Boolean(v.parsed.canonical),
    metaTitleOk: Boolean(v.parsed.title),
  }));

  const routes: RouteMapping["routes"] = { [selectedLang.code]: selectedPath };
  for (const alt of alternates) routes[alt.code] = alt.path;
  for (const miss of unreachable) routes[miss.code] = displayPath(miss.url, baseHost);
  const routing: RouteMapping[] = [{ segment: "This page", routes, matching: routeMismatches.length === 0 && unreachable.length === 0 }];

  const pages: PageDraft[] = versions.map((v) => {
    const lang = getLanguage(v.code);
    const hits = rtlHits.get(v.url.toString()) ?? 0;
    const rtlStatus: PageDraft["rtlStatus"] =
      lang.direction !== "rtl" ? "good" : v.parsed.dir !== "rtl" || hits > 6 ? "critical" : hits > 0 ? "warning" : "good";
    const seoStatus: PageDraft["seoStatus"] = !v.parsed.title
      ? "critical"
      : v.parsed.metaDescription && v.parsed.canonical
        ? "good"
        : "warning";
    return {
      url: v.url.toString(),
      path: v.path,
      languageCode: v.code,
      isSelected: v.isSelected,
      translationStatus: v.isSelected ? 100 : (translationScores.get(v.code) ?? 100),
      rtlStatus,
      seoStatus,
      issueCount: issues.filter((i) => i.page === v.path).length,
    };
  });

  return {
    pageUrl: pageUrl.toString(),
    declaredLang: selectedParsed.lang,
    detectedLanguages,
    pages,
    issues,
    hreflang,
    routing,
    comparisons,
    translationsChecked,
  };
}
