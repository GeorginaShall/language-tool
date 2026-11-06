"use client";

import { useParams } from "next/navigation";
import { FlipHorizontal2 } from "lucide-react";
import { RTLAuditPanel } from "@/components/issues/RTLAuditPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { useIssuesForScan, usePagesForScan } from "@/lib/store/hooks";
import { getLanguage } from "@/lib/languages";

export default function RtlAuditPage() {
  const params = useParams<{ id: string }>();
  const issues = useIssuesForScan(params.id).filter((i) => i.category === "rtl");
  const pages = usePagesForScan(params.id);

  if (!pages.some((p) => getLanguage(p.languageCode).direction === "rtl")) {
    return (
      <EmptyState
        icon={FlipHorizontal2}
        title="No right-to-left page was analyzed"
        body="RTL checks run on Arabic (or other right-to-left) versions of the page. None was selected or detected in this scan."
      />
    );
  }

  return <RTLAuditPanel issues={issues} />;
}
