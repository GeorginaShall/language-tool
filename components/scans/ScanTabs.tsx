"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { segment: "results", label: "Overview" },
  { segment: "translation", label: "Translation" },
  { segment: "rtl", label: "RTL" },
  { segment: "seo", label: "SEO / hreflang" },
  { segment: "routing", label: "Routing" },
  { segment: "accessibility", label: "Accessibility" },
  { segment: "pages", label: "Language versions" },
];

export function ScanTabs({ scanId }: { scanId: string }) {
  const pathname = usePathname();

  return (
    <div className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
      {TABS.map((tab) => {
        const href = `/scans/${scanId}/${tab.segment}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-[13px] font-medium transition-colors",
              active
                ? "border-accent text-text"
                : "border-transparent text-text-secondary hover:text-text"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
