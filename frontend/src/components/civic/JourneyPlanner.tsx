"use client"

/**
 * @module JourneyPlanner
 * Persona-based voter journey planner with step-by-step preparation timeline.
 *
 * Supports 5 voter personas: first-time, returning, NRI, PwD, and senior citizens.
 * Each persona has a tailored sequence of actionable preparation steps with
 * deadlines and links to official ECI portals.
 */

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, Clock, ExternalLink } from "lucide-react"
import Link from "next/link"
import { JOURNEY_PERSONAS, type JourneyPersona } from "@/lib/civic-data"

export function JourneyPlanner() {
  const [selected, setSelected] = React.useState<JourneyPersona>(JOURNEY_PERSONAS[0])
  const [completedSteps, setCompletedSteps] = React.useState<Set<number>>(new Set())

  const handlePersonaChange = (persona: JourneyPersona) => {
    setSelected(persona)
    setCompletedSteps(new Set())
  }

  const toggleStep = (index: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const progress = (completedSteps.size / selected.steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Persona selector */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Select your voter profile
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Voter persona selection"
        >
          {JOURNEY_PERSONAS.map(persona => (
            <button
              key={persona.id}
              onClick={() => handlePersonaChange(persona)}
              aria-pressed={selected.id === persona.id}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.98] ${
                selected.id === persona.id
                  ? "border-[color:var(--saffron)]/50 bg-[color:var(--saffron)]/10 text-foreground"
                  : "border-border/50 bg-card/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <span aria-hidden="true">{persona.icon}</span>
              {persona.label}
            </button>
          ))}
        </div>
      </div>

      {/* Journey content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Header */}
          <div className="mb-5 rounded-2xl border border-[color:var(--saffron)]/20 bg-[color:var(--saffron)]/5 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">{selected.icon}</span>
              <div>
                <h3 className="font-semibold">{selected.label}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">{selected.tagline}</p>
              </div>
            </div>

            {/* Progress bar */}
            {completedSteps.size > 0 && (
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Journey progress</span>
                  <span className="font-semibold text-[color:var(--saffron)]">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted/50">
                  <motion.div
                    className="h-full rounded-full bg-[color:var(--saffron)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Steps */}
          <ol className="relative space-y-3 pl-6" aria-label={`${selected.label} journey steps`}>
            {/* Vertical line */}
            <div
              className="absolute left-2.5 top-2 bottom-2 w-px bg-gradient-to-b from-[color:var(--saffron)]/40 via-border/40 to-transparent"
              aria-hidden="true"
            />

            {selected.steps.map((step, i) => {
              const isDone = completedSteps.has(i)
              return (
                <li key={i} className="relative">
                  {/* Step dot */}
                  <div
                    className={`absolute -left-[18px] mt-1 h-4 w-4 rounded-full border-2 transition-all ${
                      isDone
                        ? "border-emerald-500 bg-emerald-500/20"
                        : "border-border bg-background"
                    }`}
                    aria-hidden="true"
                  />

                  <div
                    className={`cursor-pointer rounded-xl border p-4 transition-all hover:bg-card/80 ${
                      isDone ? "border-emerald-500/20 bg-emerald-500/5" : "border-border/50 bg-card/50"
                    }`}
                    onClick={() => toggleStep(i)}
                    onKeyDown={e => (e.key === "Enter" || e.key === " ") && toggleStep(i)}
                    role="checkbox"
                    aria-checked={isDone}
                    tabIndex={0}
                    aria-label={`Step ${i + 1}: ${step.action}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        <AnimatePresence mode="wait">
                          {isDone ? (
                            <motion.div
                              key="done"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            >
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            </motion.div>
                          ) : (
                            <motion.div key="todo" className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                          )}
                        </AnimatePresence>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                            i === 0
                              ? "border-[color:var(--saffron)]/30 bg-[color:var(--saffron)]/8 text-[color:var(--saffron)]"
                              : "border-border/40 bg-background/50 text-muted-foreground"
                          }`}>
                            <Clock className="h-2.5 w-2.5" />
                            {step.deadline}
                          </div>
                        </div>
                        <p className={`mt-1.5 text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>
                          {step.action}
                        </p>
                        {step.link && !isDone && (
                          <div onClick={e => e.stopPropagation()} className="mt-2">
                            {step.link.startsWith("/") ? (
                              <Link
                                href={step.link}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--saffron)] hover:underline underline-offset-2"
                              >
                                Open portal
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <a
                                href={step.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--saffron)] hover:underline underline-offset-2"
                              >
                                Open portal
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>

          {completedSteps.size === selected.steps.length && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 text-center"
            >
              <div className="text-xl mb-1">🎉</div>
              <div className="text-sm font-semibold text-emerald-400">Journey complete! You are ready to vote.</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Visit our{" "}
                <Link href="/assistant" className="text-[color:var(--saffron)] hover:underline underline-offset-2">
                  AI assistant
                </Link>{" "}
                if you have any remaining questions.
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
