"use client";

import { useMemo, useState } from "react";
import type { FilterDef } from "@/components/ui/FilterBar";
import type { Issue, IssueSeverity, IssueStatus } from "@/types";

export function useIssueFilters(issues: Issue[]) {
  const [severity, setSeverity] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");
  const [page, setPage] = useState<string>("all");
  const [status, setStatus] = useState<string>("open");
  const [search, setSearch] = useState("");

  const pages = useMemo(() => Array.from(new Set(issues.map((i) => i.page))).sort(), [issues]);
  const languages = useMemo(
    () => Array.from(new Set(issues.flatMap((i) => [i.sourceLanguage, i.targetLanguage].filter(Boolean)))) as string[],
    [issues]
  );

  const filtered = useMemo(() => {
    return issues.filter((issue) => {
      if (severity !== "all" && issue.severity !== severity) return false;
      if (status !== "all" && issue.status !== status) return false;
      if (page !== "all" && issue.page !== page) return false;
      if (language !== "all" && issue.sourceLanguage !== language && issue.targetLanguage !== language) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const haystack = `${issue.message} ${issue.page} ${issue.sourceText ?? ""} ${issue.targetText ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [issues, severity, status, page, language, search]);

  const filters: FilterDef[] = [
    {
      key: "severity",
      label: "Severity",
      value: severity,
      onChange: setSeverity,
      options: [
        { value: "all", label: "All" },
        { value: "critical" satisfies IssueSeverity, label: "Critical" },
        { value: "warning" satisfies IssueSeverity, label: "Warning" },
        { value: "info" satisfies IssueSeverity, label: "Info" },
      ],
    },
    {
      key: "status",
      label: "Status",
      value: status,
      onChange: setStatus,
      options: [
        { value: "open" satisfies IssueStatus, label: "Open" },
        { value: "resolved" satisfies IssueStatus, label: "Resolved" },
        { value: "ignored" satisfies IssueStatus, label: "Ignored" },
        { value: "all", label: "All" },
      ],
    },
    {
      key: "language",
      label: "Language",
      value: language,
      onChange: setLanguage,
      options: [{ value: "all", label: "All" }, ...languages.map((l) => ({ value: l, label: l.toUpperCase() }))],
    },
    {
      key: "page",
      label: "Page",
      value: page,
      onChange: setPage,
      options: [{ value: "all", label: "All" }, ...pages.map((p) => ({ value: p, label: p }))],
    },
  ];

  return { filtered, filters, search, setSearch };
}
