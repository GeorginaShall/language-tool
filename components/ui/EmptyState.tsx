import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  body,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-border px-6 py-14 text-center", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-hover text-text-muted">
        <Icon size={18} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-text">{title}</p>
        {body && <p className="mx-auto max-w-sm text-sm text-text-secondary">{body}</p>}
      </div>
      {action}
    </div>
  );
}
