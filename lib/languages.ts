import type { Direction, Language, LanguageCode } from "@/types";

export const LANGUAGE_CATALOG: Record<LanguageCode, Language> = {
  en: { code: "en", name: "English", nativeName: "English", direction: "ltr" },
  ar: { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl" },
  fr: { code: "fr", name: "French", nativeName: "Français", direction: "ltr" },
  de: { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr" },
  es: { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr" },
  zh: { code: "zh", name: "Chinese", nativeName: "中文", direction: "ltr" },
  ja: { code: "ja", name: "Japanese", nativeName: "日本語", direction: "ltr" },
  he: { code: "he", name: "Hebrew", nativeName: "עברית", direction: "rtl" },
  ur: { code: "ur", name: "Urdu", nativeName: "اردو", direction: "rtl" },
  pt: { code: "pt", name: "Portuguese", nativeName: "Português", direction: "ltr" },
};

export const ALL_LANGUAGES = Object.values(LANGUAGE_CATALOG);

/** The languages a user can pick as "the language of this page". */
export const SELECTABLE_LANGUAGES: Language[] = [LANGUAGE_CATALOG.en, LANGUAGE_CATALOG.ar, LANGUAGE_CATALOG.fr];

export function getLanguage(code: LanguageCode): Language {
  return LANGUAGE_CATALOG[code];
}

export function isCatalogCode(code: string): code is LanguageCode {
  return code in LANGUAGE_CATALOG;
}

const RTL_BASES = new Set(["ar", "he", "ur", "fa", "ps", "sd", "yi", "dv", "ug"]);

export function baseLanguageCode(tag: string): string {
  return tag.trim().toLowerCase().split(/[-_]/)[0];
}

/** Describes any BCP-47 tag found on a page, including languages outside the catalog. */
export function describeLanguage(tag: string): { code: string; name: string; direction: Direction } {
  const code = baseLanguageCode(tag);
  let name = code.toUpperCase();
  try {
    name = new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? name;
  } catch {
    // Unknown or malformed subtag — fall back to the upper-cased code.
  }
  return { code, name, direction: RTL_BASES.has(code) ? "rtl" : "ltr" };
}
