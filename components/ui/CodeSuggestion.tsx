"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function CodeBlock({ label, code, tone }: { label: string; code: string; tone: "current" | "suggested" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <div className="overflow-hidden rounded-md border border-border">
      <div
        className={cn(
          "flex items-center justify-between px-3 py-1.5 text-xs font-medium",
          tone === "current" ? "bg-error-bg text-error" : "bg-success-bg text-success"
        )}
      >
        {label}
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium opacity-80 hover:opacity-100"
          aria-label={`Copy ${label} code`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-bg px-3 py-2.5 font-mono text-[13px] leading-relaxed text-text">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function CodeSuggestion({ current, suggested }: { current: string; suggested: string }) {
  return (
    <div className="space-y-2">
      <CodeBlock label="Current" code={current} tone="current" />
      <CodeBlock label="Suggested" code={suggested} tone="suggested" />
    </div>
  );
}
