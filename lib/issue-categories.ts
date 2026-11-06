import { Accessibility, FlipHorizontal2, Languages, Route, SearchCode } from "lucide-react";
import type { IssueCategory } from "@/types";

export const ISSUE_CATEGORY_CONFIG: Record<
  IssueCategory,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; hrefSegment: string }
> = {
  translation: { label: "Translation", icon: Languages, hrefSegment: "translation" },
  rtl: { label: "RTL", icon: FlipHorizontal2, hrefSegment: "rtl" },
  seo: { label: "SEO / hreflang", icon: SearchCode, hrefSegment: "seo" },
  routing: { label: "Language Routing", icon: Route, hrefSegment: "routing" },
  accessibility: { label: "Accessibility", icon: Accessibility, hrefSegment: "accessibility" },
};

export const ISSUE_CATEGORIES: IssueCategory[] = ["translation", "rtl", "seo", "routing", "accessibility"];
