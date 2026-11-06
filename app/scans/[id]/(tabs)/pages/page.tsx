"use client";

import { useParams } from "next/navigation";
import { LanguageVersionsList } from "@/components/issues/PageExplorer";
import { usePagesForScan } from "@/lib/store/hooks";

export default function LanguageVersionsPage() {
  const params = useParams<{ id: string }>();
  const pages = usePagesForScan(params.id);

  return (
    <div>
      <h2 className="mb-1 text-sm font-semibold text-text">Language versions</h2>
      <p className="mb-3 text-sm text-text-secondary">
        The selected page and every other language version found on it. Open one to compare it side by side.
      </p>
      <LanguageVersionsList scanId={params.id} pages={pages} />
    </div>
  );
}
