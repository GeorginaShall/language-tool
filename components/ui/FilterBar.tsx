"use client";

import { SearchInput } from "./SearchInput";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}

export function FilterSelect({ filter }: { filter: FilterDef }) {
  return (
    <label className="flex items-center gap-1.5 text-xs text-text-secondary">
      <span className="hidden sm:inline">{filter.label}</span>
      <select
        value={filter.value}
        onChange={(e) => filter.onChange(e.target.value)}
        className="h-8 rounded-md border border-border bg-bg px-2 text-[13px] text-text focus:border-accent"
        aria-label={filter.label}
      >
        {filter.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({
  filters,
  search,
}: {
  filters: FilterDef[];
  search?: { value: string; onChange: (value: string) => void; placeholder?: string };
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface/60 px-4 py-2.5">
      {filters.map((f) => (
        <FilterSelect key={f.key} filter={f} />
      ))}
      {search && (
        <SearchInput
          value={search.value}
          onChange={search.onChange}
          placeholder={search.placeholder}
          className="ms-auto w-full sm:w-56"
        />
      )}
    </div>
  );
}
