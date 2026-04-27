"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ExternalLink } from "lucide-react"

function domain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, "") }
  catch { return url.slice(0, 28) }
}

const AUTHORITY_DOMAINS = new Set([
  "eci.gov.in", "voters.eci.gov.in", "ecisveep.nic.in",
  "pib.gov.in", "india.gov.in", "services.india.gov.in",
  "indiankanoon.org", "indiavotes.gov.in",
])

function isAuthoritative(url: string) {
  try {
    const h = new URL(url).hostname.replace(/^www\./, "")
    return AUTHORITY_DOMAINS.has(h) || h.endsWith(".gov.in") || h.endsWith(".nic.in")
  } catch { return false }
}

export function SourceCitations({ urls, className }: { urls: string[]; className?: string }) {
  if (!urls?.length) return null
  const deduped = Array.from(new Set(urls))

  return (
    <div className={cn("mt-1 space-y-1.5", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/40"
         style={{ fontFamily: "var(--font-syne, ui-sans-serif)" }}>
        Sources
      </p>
      <div className="flex flex-wrap gap-1.5">
        {deduped.map((url, i) => {
          const auth = isAuthoritative(url)
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all duration-150",
                "border bg-card shadow-[var(--shadow-card)]",
                auth
                  ? "border-[color:var(--saffron)]/30 text-[color:var(--saffron)] hover:border-[color:var(--saffron)]/60 hover:bg-[color:var(--saffron)]/6"
                  : "border-border/70 text-muted-foreground/70 hover:border-border hover:text-foreground",
              )}
            >
              {auth && (
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--saffron)] opacity-80 shrink-0" />
              )}
              <span>{domain(url)}</span>
              <ExternalLink className="h-2.5 w-2.5 opacity-40 group-hover:opacity-70 transition-opacity shrink-0" />
            </a>
          )
        })}
      </div>
    </div>
  )
}
