"use client";

import { Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLocale } from "@/context/LocaleContext";
import { useCommandPalette } from "@/context/CommandPaletteContext";
import { useActiveScan } from "@/context/ActiveScanContext";
import { useWebsites, useAllScans } from "@/lib/store/hooks";
import { cn } from "@/lib/utils/cn";

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { uiLang, setUiLang, t } = useLocale();
  const { open } = useCommandPalette();
  const { activeWebsiteId, setActiveScanId } = useActiveScan();
  const websites = useWebsites();

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <button
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover md:hidden"
      >
        <Menu size={18} />
      </button>

      <button
        onClick={open}
        className="flex h-8 flex-1 max-w-sm items-center gap-2 rounded-md border border-border bg-bg px-2.5 text-sm text-text-muted hover:border-accent"
        aria-label="Open command palette"
      >
        <Search size={14} />
        <span className="hidden sm:inline">{t("topbar.search")}</span>
        <kbd className="ms-auto hidden items-center gap-0.5 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-muted sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <div className="ms-auto flex items-center gap-1.5">
        <WebsiteSwitcher activeWebsiteId={activeWebsiteId} websites={websites} onPick={setActiveScanId} />

        <div className="hidden items-center rounded-md border border-border bg-bg p-0.5 text-xs font-medium sm:flex">
          {(["en", "ar"] as const).map((code) => (
            <button
              key={code}
              onClick={() => setUiLang(code)}
              className={cn(
                "rounded px-2 py-1 uppercase transition-colors",
                uiLang === code ? "bg-accent text-white" : "text-text-secondary hover:text-text"
              )}
              aria-pressed={uiLang === code}
            >
              {code}
            </button>
          ))}
        </div>

        <button
          onClick={toggleTheme}
          aria-label="Toggle color theme"
          className="rounded-md p-2 text-text-secondary hover:bg-surface-hover hover:text-text"
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}

function WebsiteSwitcher({
  activeWebsiteId,
  websites,
  onPick,
}: {
  activeWebsiteId: string | undefined;
  websites: { id: string; label: string }[];
  onPick: (scanId: string) => void;
}) {
  const scans = useAllScans();

  return (
    <select
      value={activeWebsiteId ?? ""}
      onChange={(e) => {
        const websiteId = e.target.value;
        const latest = scans.find((s) => s.websiteId === websiteId);
        if (latest) onPick(latest.id);
      }}
      className="hidden h-8 max-w-56 truncate rounded-md border border-border bg-bg px-2 font-mono text-[13px] text-text focus:border-accent md:block"
      aria-label="Active website"
    >
      {websites.map((w) => (
        <option key={w.id} value={w.id}>
          {w.label}
        </option>
      ))}
    </select>
  );
}
