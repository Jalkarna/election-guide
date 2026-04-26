"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Search, Globe, Loader2 } from "lucide-react"

interface ToolCallChipProps {
  toolName: string
  args: Record<string, unknown>
  isRunning?: boolean
  className?: string
}

export function ToolCallChip({ toolName, args, isRunning = false, className }: ToolCallChipProps) {
  const isSearch   = toolName === "search"
  const isFetch    = toolName === "fetch_url"
  const isSchedule = toolName === "get_election_schedule"

  const label = React.useMemo(() => {
    if (isSearch)   return `Searching: ${String(args.query ?? "").slice(0, 44)}`
    if (isFetch)    return `Fetching: ${String(args.url ?? "").slice(0, 44)}`
    if (isSchedule) return "Fetching election schedule"
    return toolName.replace(/_/g, " ")
  }, [toolName, args, isSearch, isFetch, isSchedule])

  const Icon = isSearch ? Search : Globe

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        isRunning
          ? "border-[color:var(--saffron)]/25 bg-[color:var(--saffron)]/8 text-[color:var(--saffron)] shimmer-bg"
          : "border-border bg-muted/60 text-muted-foreground",
        className,
      )}
    >
      {isRunning
        ? <Loader2 className="h-2.5 w-2.5 animate-spin shrink-0" />
        : <Icon className="h-2.5 w-2.5 shrink-0" />
      }
      <span className="max-w-[210px] truncate">{label}</span>
    </span>
  )
}
