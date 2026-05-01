"use client"

/**
 * @module ReadinessChecklist
 * Interactive 7-item voter readiness checklist with animated progress ring.
 *
 * Persists state to sessionStorage so progress survives page navigation.
 * Each item links to the relevant official ECI portal or platform page.
 */

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, Circle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { READINESS_CHECKLIST } from "@/lib/civic-data"

const STORAGE_KEY = "eg-readiness-checklist"

function loadSaved(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

/** Circular SVG progress ring in India tricolor gradient */
function ReadinessRing({ score, total }: { score: number; total: number }) {
  const pct = score / total
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - pct)
  const angle = pct * 100

  const color =
    angle >= 86 ? "#22c55e" :
    angle >= 57 ? "#FF9933" :
    "#ef4444"

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <motion.circle
          cx="60" cy="60" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="text-center">
        <motion.div
          key={score}
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-bold"
          style={{ color }}
        >
          {Math.round(pct * 100)}%
        </motion.div>
        <div className="text-xs text-muted-foreground">
          {score}/{total} done
        </div>
      </div>
    </div>
  )
}

/** Category badge */
const categoryColors: Record<string, string> = {
  Documents: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Verification: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Logistics: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Knowledge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Accessibility: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Rules: "bg-red-500/10 text-red-400 border-red-500/20",
}

export function ReadinessChecklist() {
  const [checked, setChecked] = React.useState<Set<string>>(new Set())
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setChecked(loadSaved())
    setMounted(true)
  }, [])

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      } catch { /* quota exceeded — ignore */ }
      return next
    })
  }

  const score = checked.size
  const total = READINESS_CHECKLIST.length

  if (!mounted) return null

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
      {/* Ring */}
      <div className="flex flex-col items-center gap-3">
        <ReadinessRing score={score} total={total} />
        <div className="text-center">
          <div className="text-sm font-semibold">
            {score === total
              ? "You are ready to vote! 🎉"
              : score === 0
              ? "Start your preparation"
              : "Good progress — keep going"}
          </div>
          <button
            onClick={() => {
              const next = new Set<string>()
              setChecked(next)
              try { window.sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
            }}
            className="mt-2 text-xs text-muted-foreground/60 underline underline-offset-2 hover:text-muted-foreground transition-colors"
          >
            Reset all
          </button>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2" role="list" aria-label="Voter readiness checklist">
        {READINESS_CHECKLIST.map((item, i) => {
          const isDone = checked.has(item.id)
          const categoryClass = categoryColors[item.category] ?? "bg-muted text-muted-foreground"
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              role="listitem"
            >
              <div
                className={`group flex items-start gap-3 rounded-xl border p-4 transition-all cursor-pointer ${
                  isDone
                    ? "border-emerald-500/25 bg-emerald-500/6"
                    : "border-border/50 bg-card/50 hover:border-border hover:bg-card/80"
                }`}
                onClick={() => toggle(item.id)}
                onKeyDown={e => (e.key === "Enter" || e.key === " ") && toggle(item.id)}
                role="checkbox"
                aria-checked={isDone}
                tabIndex={0}
                aria-label={item.title}
              >
                <div className="mt-0.5 shrink-0">
                  <AnimatePresence mode="wait">
                    {isDone ? (
                      <motion.div
                        key="checked"
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      >
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      </motion.div>
                    ) : (
                      <motion.div key="unchecked" initial={{ scale: 1 }} animate={{ scale: 1 }}>
                        <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className={`text-sm font-medium leading-snug ${isDone ? "text-muted-foreground line-through" : ""}`}>
                      {item.title}
                    </span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${categoryClass}`}>
                      {item.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                  {item.link && (
                    <div className="mt-2" onClick={e => e.stopPropagation()}>
                      {item.link.startsWith("/") ? (
                        <Link
                          href={item.link}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--saffron)] hover:underline underline-offset-2"
                        >
                          {item.linkText}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--saffron)] hover:underline underline-offset-2"
                        >
                          {item.linkText}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
