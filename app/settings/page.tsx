"use client";

import { Moon, Sun } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "@/context/ThemeContext";
import { useLocale } from "@/context/LocaleContext";
import { useWebsites } from "@/lib/store/hooks";
import { LanguageBadgeGroup } from "@/components/ui/LanguageBadge";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { uiLang, setUiLang, t } = useLocale();
  const websites = useWebsites();

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold text-text">{t("settings.title")}</h1>

      <Card className="p-4 sm:p-5">
        <p className="text-[13px] font-medium text-text">{t("settings.appearance")}</p>
        <p className="mt-1 text-sm text-text-secondary">Choose how the interface looks on this device.</p>
        <div className="mt-3 flex gap-2">
          {(
            [
              { value: "dark" as const, label: "Dark", icon: Moon },
              { value: "light" as const, label: "Light", icon: Sun },
            ]
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                theme === opt.value ? "border-accent bg-accent/10 text-text" : "border-border text-text-secondary hover:bg-surface-hover"
              )}
              aria-pressed={theme === opt.value}
            >
              <opt.icon size={15} />
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <p className="text-[13px] font-medium text-text">{t("settings.interfaceLanguage")}</p>
        <p className="mt-1 text-sm text-text-secondary">
          Switches the checker&apos;s own interface, including layout direction.
        </p>
        <div className="mt-3 flex gap-2">
          {(
            [
              { value: "en" as const, label: "English" },
              { value: "ar" as const, label: "العربية" },
            ]
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setUiLang(opt.value)}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                uiLang === opt.value ? "border-accent bg-accent/10 text-text" : "border-border text-text-secondary hover:bg-surface-hover"
              )}
              aria-pressed={uiLang === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <p className="text-[13px] font-medium text-text">Tracked websites</p>
        <div className="mt-3 divide-y divide-border">
          {websites.map((w) => (
            <div key={w.id} className="flex items-center justify-between py-2.5 text-sm">
              <span className="font-mono text-text">{w.label}</span>
              <LanguageBadgeGroup languages={w.languages} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
