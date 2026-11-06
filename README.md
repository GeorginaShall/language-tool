# Multilingual Website Checker

Scans **one web page** and audits its language versions for translation, RTL, SEO/hreflang, routing, and accessibility issues. Built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How a scan works

1. Enter a page URL and choose the language the page is written in (English, Arabic or French).
2. The server fetches that page and reads what it publishes about its languages: `<html lang>`, `hreflang` alternates, and language-switcher links.
3. It fetches up to four of those other language versions (EN/AR/FR first) and compares each one with the page you selected — titles, meta descriptions, headings, button/link text, and body copy.
4. Results appear under: **Overview** (detected languages + issue categories), **Translation**, **RTL**, **SEO / hreflang**, **Routing**, **Accessibility**, and **Language versions** (side-by-side comparison).

Everything is derived from the live HTML/CSS that was fetched — nothing is simulated. RTL checks look at `dir="rtl"` and scan the page's stylesheets for hardcoded `left`/`right` declarations.

Inherent limits of a static fetch: pages that render entirely with client-side JavaScript only expose their initial HTML, sites that block automated requests will fail with a clear error, and "is this text translated" is inferred (identical strings, script/stop-word language detection) rather than linguistically verified.

## Layout

- `lib/scanner/pageScanner.ts` — the scanner (server-side; uses `cheerio`).
- `app/api/scan/route.ts` — `POST /api/scan`, the only endpoint.
- `lib/api/scans.ts` — the service layer the UI calls (`scanWebsite`, `rescan`, `getIssues`, …).
- `lib/store/` — small observable client store, persisted to `localStorage`.
- `types/index.ts` — the data model.
