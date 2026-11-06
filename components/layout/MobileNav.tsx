"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import { useLocale } from "@/context/LocaleContext";
import { SidebarNav } from "./Sidebar";

export function MobileNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t, dir } = useLocale();

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex md:hidden" style={{ justifyContent: dir === "rtl" ? "flex-end" : "flex-start" }}>
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          "relative z-10 flex h-full w-72 max-w-[85vw] flex-col border-e border-border bg-surface shadow-2xl",
          dir === "rtl" ? "animate-slide-in-end" : "animate-slide-in-start"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="text-[13px] font-semibold text-text">{t("nav.product")}</span>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <X size={16} />
          </button>
        </div>
        <SidebarNav onNavigate={onClose} />
      </div>
    </div>,
    document.body
  );
}
