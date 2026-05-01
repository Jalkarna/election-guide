"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, Globe, Loader2 } from "lucide-react"
import { LANGUAGES, LANGUAGE_LABELS, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function LanguageDropdown({
  value,
  onChange,
  label,
  loading,
}: {
  value: Language
  onChange: (v: Language) => void
  label: string
  loading: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onMouse)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onMouse)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label={label}
        aria-expanded={open}
        className={cn(
          "flex max-w-[54vw] items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors duration-150 sm:max-w-none",
          "text-muted-foreground/70 hover:text-foreground hover:bg-accent/60",
          open && "bg-accent/60 text-foreground",
        )}
      >
        <Globe className="h-3 w-3 shrink-0" />
        <span className="truncate">{LANGUAGE_LABELS[value]}</span>
        {loading && <Loader2 className="h-3 w-3 shrink-0 animate-spin" />}
        <ChevronDown className={cn(
          "h-3 w-3 shrink-0 transition-transform duration-150",
          open && "rotate-180",
        )} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute bottom-full left-0 z-50 mb-1.5 max-h-[48dvh] min-w-[148px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-float)]"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="max-h-[48dvh] overflow-y-auto py-1">
              {LANGUAGES.map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => { onChange(lang); setOpen(false) }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-[6px] text-left text-xs transition-colors duration-100",
                    lang === value
                      ? "bg-[color:var(--saffron)]/8 font-semibold text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <span className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    lang === value ? "bg-[color:var(--saffron)]" : "bg-transparent",
                  )} />
                  <span className="truncate">{LANGUAGE_LABELS[lang]}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

