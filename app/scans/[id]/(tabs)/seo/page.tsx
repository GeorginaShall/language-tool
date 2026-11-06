"use client";

import { useParams } from "next/navigation";
import { SEOAuditTable } from "@/components/issues/SEOAuditTable";
import { useHreflangForScan, useIssuesForScan } from "@/lib/store/hooks";

export default function SeoAuditPage() {
  const params = useParams<{ id: string }>();
  const issues = useIssuesForScan(params.id).filter((i) => i.category === "seo");
  const entries = useHreflangForScan(params.id);

  return <SEOAuditTable entries={entries} issues={issues} />;
}
