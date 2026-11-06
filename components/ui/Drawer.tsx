"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLocale } from "@/context/LocaleContext";

export function Drawer({
  isOpen,
  onClose,
  title,
  eyebrow,
  children,
  footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { dir } = useLocale();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    ref.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" style={{ justifyContent: dir === "rtl" ? "flex-start" : "flex-end" }}>
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        className={cn(
          "relative z-10 flex h-full w-full max-w-md flex-col border-s border-border bg-surface shadow-2xl outline-none",
          dir === "rtl" ? "animate-slide-in-start" : "animate-slide-in-end"
        )}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            {eyebrow && <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{eyebrow}</p>}
            <h2 id="drawer-title" className="mt-0.5 text-base font-semibold text-text">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-text"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-border px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
