"use client"

import * as React from "react"
import { ArrowUp, Square } from "lucide-react"
import { LanguageDropdown } from "@/components/chat/LanguageDropdown"
import type { Language, UiCopyKey } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function Composer({
  value, onChange, onSubmit, isStreaming, isSubmitting, onStop, language, onLanguageChange, t, translationsLoading
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  isStreaming: boolean
  isSubmitting: boolean
  onStop: () => void
  language: Language
  onLanguageChange: (v: Language) => void
  t: (key: UiCopyKey) => string
  translationsLoading: boolean
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null)

  const resize = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 196)}px`
  }, [])

  React.useEffect(() => { resize() }, [value, resize])

  const canSubmit = value.trim().length > 0 && !isStreaming && !isSubmitting
  const syncValue = (nextValue: string) => {
    onChange(nextValue)
    resize()
  }
  const submitCurrent = () => {
    const nextValue = ref.current?.value ?? value
    if (nextValue.trim().length === 0 || isStreaming || isSubmitting) return
    if (nextValue !== value) onChange(nextValue)
    onSubmit()
  }

  return (
    <div className={cn(
      "relative mx-auto w-full max-w-[860px] rounded-xl border bg-card transition-all duration-200",
      "shadow-[var(--shadow-composer)] border-border/70",
    )}>
      <textarea
        ref={ref}
        value={value}
        onChange={e => syncValue(e.target.value)}
        onInput={e => syncValue(e.currentTarget.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            submitCurrent()
          }
        }}
        placeholder={t("askPlaceholder")}
        rows={1}
        className="block max-h-[38dvh] min-h-[54px] w-full resize-none bg-transparent px-3.5 pb-[42px] pr-13 pt-[14px] text-base leading-[22px] text-foreground placeholder:text-muted-foreground/45 focus:outline-none sm:px-4 sm:text-sm"
      />
      <div className="absolute left-2.5 bottom-2 flex items-center">
        <LanguageDropdown
          value={language}
          onChange={onLanguageChange}
          label={t("selectLanguage")}
          loading={translationsLoading}
        />
      </div>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            title={t("stopResponse")}
            aria-label={t("stopResponse")}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border/70 bg-muted/80 text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/8 hover:text-destructive sm:h-8 sm:w-8"
          >
            <Square className="h-3 w-3 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submitCurrent}
            disabled={!canSubmit}
            title={t("sendMessage")}
            aria-label={t("sendMessage")}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 sm:h-8 sm:w-8",
              canSubmit
                ? "cursor-pointer bg-[color:var(--saffron)] text-[color:var(--saffron-foreground)] shadow-sm hover:opacity-90 active:scale-95"
                : "cursor-not-allowed bg-muted/60 text-muted-foreground/25",
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

