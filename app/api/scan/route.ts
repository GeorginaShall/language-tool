import { NextRequest, NextResponse } from "next/server";
import { scanPage, ScanError } from "@/lib/scanner/pageScanner";
import { SELECTABLE_LANGUAGES } from "@/lib/languages";
import type { LanguageCode } from "@/types";

export const maxDuration = 60;

interface ScanRequestBody {
  url: string;
  language: LanguageCode;
}

export async function POST(request: NextRequest) {
  let body: ScanRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  if (!body.url || typeof body.url !== "string") {
    return NextResponse.json({ ok: false, error: "A page URL is required." }, { status: 400 });
  }
  if (!SELECTABLE_LANGUAGES.some((l) => l.code === body.language)) {
    return NextResponse.json({ ok: false, error: "Choose the page's language: English, Arabic or French." }, { status: 400 });
  }

  try {
    const result = await scanPage(body);
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message = err instanceof ScanError ? err.message : "Could not scan this page. Please try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
