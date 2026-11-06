"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToastKind = "success" | "info" | "warning";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let idCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = ++idCounter;
    setItems((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 3200);
  }, []);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 end-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              "animate-fade-in flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 text-sm shadow-lg backdrop-blur-sm",
              "bg-surface border-border text-text"
            )}
          >
            {item.kind === "success" && <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />}
            {item.kind === "warning" && <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warning" />}
            {item.kind === "info" && <Info size={16} className="mt-0.5 shrink-0 text-info" />}
            <span className="flex-1 leading-snug">{item.message}</span>
            <button
              onClick={() => dismiss(item.id)}
              aria-label="Dismiss notification"
              className="shrink-0 text-text-muted hover:text-text"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
