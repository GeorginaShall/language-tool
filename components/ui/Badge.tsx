import { AlertOctagon, CheckCircle2, CircleAlert, Info, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { IssueSeverity, IssueStatus, ScanStatus } from "@/types";

const SEVERITY_STYLES: Record<IssueSeverity, string> = {
  critical: "text-error bg-error-bg",
  warning: "text-warning bg-warning-bg",
  info: "text-info bg-info-bg",
};

const SEVERITY_ICON: Record<IssueSeverity, React.ComponentType<{ size?: number; className?: string }>> = {
  critical: AlertOctagon,
  warning: CircleAlert,
  info: Info,
};

const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

export function SeverityBadge({ severity, className }: { severity: IssueSeverity; className?: string }) {
  const Icon = SEVERITY_ICON[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
        SEVERITY_STYLES[severity],
        className
      )}
    >
      <Icon size={12} />
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

const STATUS_STYLES: Record<IssueStatus, string> = {
  open: "text-text-secondary bg-surface-hover",
  resolved: "text-success bg-success-bg",
  ignored: "text-text-muted bg-surface-hover",
};

const STATUS_LABEL: Record<IssueStatus, string> = {
  open: "Open",
  resolved: "Resolved",
  ignored: "Ignored",
};

export function IssueStatusBadge({ status, className }: { status: IssueStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

const SCAN_STATUS_CONFIG: Record<
  ScanStatus,
  { label: string; className: string; icon: React.ComponentType<{ size?: number; className?: string }> }
> = {
  completed: { label: "Completed", className: "text-success bg-success-bg", icon: CheckCircle2 },
  scanning: { label: "Scanning", className: "text-info bg-info-bg", icon: Loader2 },
  queued: { label: "Queued", className: "text-text-secondary bg-surface-hover", icon: Loader2 },
  failed: { label: "Failed", className: "text-error bg-error-bg", icon: XCircle },
};

export function ScanStatusBadge({ status, className }: { status: ScanStatus; className?: string }) {
  const config = SCAN_STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon size={12} className={status === "scanning" ? "animate-spin" : ""} />
      {config.label}
    </span>
  );
}
