"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Banknote, CalendarRange, Cpu, FileText, Scale, Vote } from "lucide-react"
import { UI_COPY, type UiCopyKey } from "@/lib/i18n"
import { ChakraIcon } from "@/components/chat/ChakraIcon"

// ─── Suggestion prompts ────────────────────────────────────────────────────
const SUGGESTIONS: { key: UiCopyKey; prompt: string; Icon: React.ElementType }[] = [
  { key: "suggestionRegister", prompt: UI_COPY.suggestionRegister, Icon: Vote },
  { key: "suggestionMcc", prompt: UI_COPY.suggestionMcc, Icon: Scale },
  { key: "suggestionNomination", prompt: UI_COPY.suggestionNomination, Icon: FileText },
  { key: "suggestionEvm", prompt: UI_COPY.suggestionEvm, Icon: Cpu },
  { key: "suggestionExpense", prompt: UI_COPY.suggestionExpense, Icon: Banknote },
  { key: "suggestionSchedule", prompt: UI_COPY.suggestionSchedule, Icon: CalendarRange },
]


export function Greeting({
  onSuggest,
  disabled,
  t,
}: {
  onSuggest: (text: string) => void
  disabled: boolean
  t: (key: UiCopyKey) => string
}) {
  return (
    <div className="flex min-h-full flex-col items-center px-3 pb-8 pt-8 sm:px-4 sm:pb-12 sm:pt-[13vh]">
      <div className="w-full max-w-[600px] space-y-6 sm:space-y-8">

        {/* Hero */}
        <motion.div
          className="flex flex-col items-center gap-4 text-center sm:gap-5"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Chakra icon with glow */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[color:var(--saffron)] opacity-15 blur-3xl scale-[2]" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[color:var(--saffron)]/20 bg-[color:var(--saffron)]/8 sm:h-16 sm:w-16">
              <ChakraIcon className="h-9 w-9 text-[color:var(--saffron)] sm:h-10 sm:w-10" spinning />
            </div>
          </div>

          <div>
            <h1 className="font-display text-[1.9rem] font-bold leading-none tracking-tight sm:text-[2.1rem]">
              {t("appName")}
            </h1>
            <p className="mx-auto mt-2.5 max-w-[320px] text-sm leading-relaxed text-muted-foreground sm:max-w-[380px]">
              {t("heroTagline")}
            </p>
          </div>
        </motion.div>

        {/* Suggestion grid */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map(({ key, prompt, Icon }, i) => (
            <motion.button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSuggest(prompt)}
              className="group flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-card px-3.5 py-3 text-left text-sm font-medium text-foreground shadow-[var(--shadow-card)] transition-all duration-200 hover:border-[color:var(--saffron)]/50 hover:bg-accent/50 hover:shadow-[var(--shadow-float)] disabled:pointer-events-none disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--saffron)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99] sm:px-4 sm:py-3.5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.055, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--saffron)]/80 transition-opacity group-hover:text-[color:var(--saffron)]" />
              <span className="leading-snug text-foreground/80 transition-colors group-hover:text-foreground">{t(key)}</span>
            </motion.button>
          ))}
        </div>

        {/* Badges */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground/35 sm:gap-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {(["badgeEci", "badgeNonPartisan", "badgeIndia"] as const).map(key => (
            <span key={key} className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[color:var(--saffron)]/50" />
              {t(key)}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

