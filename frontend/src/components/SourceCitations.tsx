"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"

function domain(url: string) {
  try { return new URL(url).hostname.replace("www.", "") }
  catch { return url.slice(0, 26) }
}

export function SourceCitations({ urls, className }: { urls: string[]; className?: string }) {
  if (!urls?.length) return null
  const deduped = Array.from(new Set(urls))
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 pt-0.5", className)}>
      <span className="mr-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/35">
        Sources
      </span>
      {deduped.map((url, i) => (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] text-muted-foreground/70 shadow-[var(--shadow-card)] transition-colors hover:border-[color:var(--saffron)]/40 hover:text-foreground"
        >
          {domain(url)}
          <ArrowUpRight className="h-2.5 w-2.5 opacity-50" />
        </a>
      ))}
    </div>
  )
}
