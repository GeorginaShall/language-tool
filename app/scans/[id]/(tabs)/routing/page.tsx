"use client";

import { useParams } from "next/navigation";
import { RoutingAuditPanel } from "@/components/issues/RoutingAuditPanel";
import { useIssuesForScan, useRoutingForScan } from "@/lib/store/hooks";
import { ALL_LANGUAGES } from "@/lib/languages";

export default function RoutingAuditPage() {
  const params = useParams<{ id: string }>();
  const issues = useIssuesForScan(params.id).filter((i) => i.category === "routing");
  const mappings = useRoutingForScan(params.id);

  const codes = new Set(mappings.flatMap((m) => Object.keys(m.routes)));
  const languages = ALL_LANGUAGES.filter((l) => codes.has(l.code));

  return <RoutingAuditPanel mappings={mappings} languages={languages} issues={issues} />;
}
