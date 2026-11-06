import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ISSUE_CATEGORY_CONFIG } from "@/lib/issue-categories";
import type { IssueCategory } from "@/types";

export function CategoryCard({
  category,
  count,
  href,
}: {
  category: IssueCategory;
  count: number;
  href: string;
}) {
  const config = ISSUE_CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <Link href={href}>
      <Card className="group flex h-full flex-col justify-between gap-4 p-4 transition-colors hover:border-accent">
        <div className="flex items-center justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-hover text-text-secondary">
            <Icon size={16} />
          </div>
          <ChevronRight size={15} className="text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div>
          <p className="font-mono text-2xl font-semibold text-text">{count}</p>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            {config.label} {count === 1 ? "issue" : "issues"}
          </p>
        </div>
      </Card>
    </Link>
  );
}
