import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/Card";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "warning" | "error";
}) {
  const toneClass = tone === "error" ? "text-error" : tone === "warning" ? "text-warning" : "text-accent";
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-text-secondary">{label}</span>
        <Icon size={15} className={cn("shrink-0", toneClass)} />
      </div>
      <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-text">{value}</p>
    </Card>
  );
}
