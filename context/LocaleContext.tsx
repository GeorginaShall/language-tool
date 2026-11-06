"use client";

import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { translate, type TranslationKey, type UiLang } from "@/lib/i18n/translations";
import { getLanguage } from "@/lib/languages";
import { useLocalStorageValue } from "@/lib/hooks/useLocalStorageValue";

interface LocaleContextValue {
  uiLang: UiLang;
  dir: "ltr" | "rtl";
  setUiLang: (lang: UiLang) => void;
  t: (key: TranslationKey) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [uiLang, setUiLang] = useLocalStorageValue<UiLang>("mwc-ui-lang", "en");

  const dir = useMemo(() => getLanguage(uiLang).direction, [uiLang]);

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = uiLang;
  }, [dir, uiLang]);

  const t = useCallback((key: TranslationKey) => translate(key, uiLang), [uiLang]);

  const value = useMemo(() => ({ uiLang, dir, setUiLang, t }), [uiLang, dir, setUiLang, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
