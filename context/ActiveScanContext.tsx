"use client";

import { createContext, useContext, useMemo } from "react";
import { useAllScans, useWebsites } from "@/lib/store/hooks";
import { useLocalStorageValue } from "@/lib/hooks/useLocalStorageValue";

interface ActiveScanContextValue {
  activeScanId: string | undefined;
  activeWebsiteId: string | undefined;
  setActiveScanId: (scanId: string) => void;
}

const ActiveScanContext = createContext<ActiveScanContextValue | null>(null);

export function ActiveScanProvider({ children }: { children: React.ReactNode }) {
  const scans = useAllScans();
  const websites = useWebsites();
  const [manualScanId, setActiveScanId] = useLocalStorageValue<string>("mwc-active-scan", "");

  const activeScanId = useMemo(() => {
    if (manualScanId && scans.some((s) => s.id === manualScanId)) return manualScanId;
    const completed = scans.find((s) => s.status === "completed");
    return completed?.id ?? scans[0]?.id;
  }, [manualScanId, scans]);

  const activeWebsiteId = useMemo(() => {
    const scan = scans.find((s) => s.id === activeScanId);
    return scan?.websiteId ?? websites[0]?.id;
  }, [activeScanId, scans, websites]);

  const value = useMemo(
    () => ({ activeScanId, activeWebsiteId, setActiveScanId }),
    [activeScanId, activeWebsiteId, setActiveScanId]
  );

  return <ActiveScanContext.Provider value={value}>{children}</ActiveScanContext.Provider>;
}

export function useActiveScan() {
  const ctx = useContext(ActiveScanContext);
  if (!ctx) throw new Error("useActiveScan must be used within ActiveScanProvider");
  return ctx;
}
