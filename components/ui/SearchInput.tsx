import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search size={14} className="pointer-events-none absolute inset-inline-start-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search…"}
        className="h-8 w-full rounded-md border border-border bg-bg ps-8 pe-3 text-sm text-text placeholder:text-text-muted focus:border-accent"
        aria-label={placeholder ?? "Search"}
      />
    </div>
  );
}
