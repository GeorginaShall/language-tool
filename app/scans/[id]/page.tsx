"use client";

import { useParams } from "next/navigation";
import { ScanProgress } from "@/components/scans/ScanProgress";

export default function ScanPage() {
  const params = useParams<{ id: string }>();
  return <ScanProgress scanId={params.id} />;
}
