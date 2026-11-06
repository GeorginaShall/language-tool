"use client";

import { useEffect } from "react";
import { ThemeProvider } from "./ThemeContext";
import { LocaleProvider } from "./LocaleContext";
import { ToastProvider } from "./ToastContext";
import { CommandPaletteProvider } from "./CommandPaletteContext";
import { ActiveScanProvider } from "./ActiveScanContext";
import { dataStore } from "@/lib/store/data-store";

function StoreHydrator() {
  useEffect(() => {
    dataStore.hydrate();
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <ToastProvider>
          <ActiveScanProvider>
            <CommandPaletteProvider>
              <StoreHydrator />
              {children}
            </CommandPaletteProvider>
          </ActiveScanProvider>
        </ToastProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}
