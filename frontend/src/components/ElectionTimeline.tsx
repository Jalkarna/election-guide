"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CalendarRange } from "lucide-react"

interface TimelineStep {
  phase: string
  title: string
  description: string
  date_or_duration: string
}

export function ElectionTimeline({ steps, className }: { steps: TimelineStep[]; className?: string }) {
  return (
    <div className={cn("my-1 w-full space-y-0.5", className)}>
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--saffron)]">
        <CalendarRange className="h-3 w-3" />
        Election Timeline
      </p>

      <div className="relative max-h-[280px] overflow-y-auto pr-1">
        {/* Vertical track */}
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={i} className="relative flex gap-3 pb-3 last:pb-0">
              {/* Step marker */}
              <div className="relative z-10 mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[color:var(--saffron)] text-[color:var(--saffron-foreground)]">
                <span className="text-[10px] font-bold leading-none">{i + 1}</span>
              </div>

              {/* Card */}
              <div className="flex-1 rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {step.phase}
                    </p>
                    <p className="mt-0.5 text-[13px] font-semibold text-foreground leading-snug">
                      {step.title}
                    </p>
                  </div>
                  {step.date_or_duration && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/30 px-1.5 py-0.5 text-[9px] text-muted-foreground/70 whitespace-nowrap">
                      {step.date_or_duration}
                    </span>
                  )}
                </div>
                {step.description && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground/70">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
