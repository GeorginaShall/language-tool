"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  PlusCircle,
  FileSearch,
  Languages,
  FlipHorizontal2,
  SearchCode,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLocale } from "@/context/LocaleContext";
import { useActiveScan } from "@/context/ActiveScanContext";
import type { TranslationKey } from "@/lib/i18n/translations";

interface NavItem {
  key: TranslationKey;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  match: (pathname: string) => boolean;
}

function useNavItems(): NavItem[] {
  const { activeScanId } = useActiveScan();
  // With no scan yet there is nothing to open, so the scan-scoped links lead to the scan form.
  const scanHref = (segment: string) => (activeScanId ? `/scans/${activeScanId}/${segment}` : "/scans/new");

  return [
    { key: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard, match: (p) => p === "/dashboard" || p === "/" },
    { key: "nav.websites", href: "/websites", icon: Globe, match: (p) => p.startsWith("/websites") },
    { key: "nav.newScan", href: "/scans/new", icon: PlusCircle, match: (p) => p === "/scans/new" },
    { key: "nav.scanResults", href: scanHref("results"), icon: FileSearch, match: (p) => p.endsWith("/results") },
    { key: "nav.translationIssues", href: scanHref("translation"), icon: Languages, match: (p) => p.endsWith("/translation") },
    { key: "nav.rtlAudit", href: scanHref("rtl"), icon: FlipHorizontal2, match: (p) => p.endsWith("/rtl") },
    { key: "nav.seoHreflang", href: scanHref("seo"), icon: SearchCode, match: (p) => p.endsWith("/seo") },
    { key: "nav.settings", href: "/settings", icon: Settings, match: (p) => p.startsWith("/settings") },
  ];
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const items = useNavItems();

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3" aria-label="Primary">
      {items.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
              active ? "bg-surface-hover text-text" : "text-text-secondary hover:bg-surface-hover hover:text-text"
            )}
          >
            <Icon size={16} className={active ? "text-accent" : "text-text-muted"} />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const { t } = useLocale();
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-e border-border bg-surface md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-xs font-bold text-white">
          M
        </div>
        <span className="truncate text-[13px] font-semibold text-text">{t("nav.product")}</span>
      </div>
      <SidebarNav />
    </aside>
  );
}
