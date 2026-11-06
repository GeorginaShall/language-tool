"use client";

import { SELECTABLE_LANGUAGES } from "@/lib/languages";
import type { LanguageCode } from "@/types";

export function PageLanguageSelect({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as LanguageCode)}
      className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-text focus:border-accent sm:w-64"
    >
      {SELECTABLE_LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.name} ({lang.nativeName})
        </option>
      ))}
    </select>
  );
}
