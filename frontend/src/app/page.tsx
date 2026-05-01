"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ThinkingBlock } from "@/components/ThinkingBlock"
import { SourceCitations } from "@/components/SourceCitations"
import { createSession, listSessions, deleteSession, getSession, translateUiCopy, type Session } from "@/lib/api"
import { BACKEND_WS_URL } from "@/lib/config"
import { LANGUAGES, LANGUAGE_LABELS, UI_COPY, type Language, type UiCopy, type UiCopyKey } from "@/lib/i18n"
import { sanitizeAssistantContent, stripMarkdown } from "@/lib/markdown"
import {
  Plus, Trash2, ArrowUp, Menu, Square,
  ChevronLeft, ChevronRight, ChevronDown, Globe,
  Vote, Scale, FileText, Cpu, Banknote, CalendarRange, X, Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ─────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: string
  toolCalls?: { id: string; name: string; args: Record<string, unknown>; done: boolean }[]
  sources?: string[]
  workedForMs?: number  // milliseconds the turn took (set after streaming ends)
}

function BlinkText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("blink-text", className)}>
      {text}
    </span>
  )
}

function yieldToPaint() {
  return new Promise<void>((resolve) => {
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => window.setTimeout(resolve, 18))
    } else {
      setTimeout(resolve, 18)
    }
  })
}

function useUiCopy(language: Language) {
  const [translations, setTranslations] = React.useState<Partial<Record<Language, UiCopy>>>({})
  const [loadingLanguage, setLoadingLanguage] = React.useState<Language | null>(null)

  React.useEffect(() => {
    let cancelled = false

    if (language === "English") {
      return
    }

    if (translations[language]) return

    const cacheKey = `electionguide-ui-copy:${language}:v2`

    window.queueMicrotask(() => {
      if (cancelled) return

      try {
        const cached = window.localStorage.getItem(cacheKey)
        if (cached) {
          const nextCopy = { ...UI_COPY, ...JSON.parse(cached) }
          setTranslations(prev => ({ ...prev, [language]: nextCopy }))
          return
        }
      } catch (error) {
        console.warn("Failed to read translated UI cache", error)
      }

      setLoadingLanguage(language)
      translateUiCopy(language, UI_COPY)
        .then(translated => {
          if (cancelled) return
          const nextCopy = { ...UI_COPY, ...translated }
          setTranslations(prev => ({ ...prev, [language]: nextCopy }))
          try {
            window.localStorage.setItem(cacheKey, JSON.stringify(translated))
          } catch (error) {
            console.warn("Failed to cache translated UI", error)
          }
        })
        .catch(error => {
          if (!cancelled) {
            console.error("translateUiCopy error:", error)
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingLanguage(current => current === language ? null : current)
          }
        })
    })

    return () => {
      cancelled = true
    }
  }, [language, translations])

  const copy = language === "English" ? UI_COPY : (translations[language] ?? UI_COPY)
  const t = React.useCallback((key: UiCopyKey) => copy[key] ?? UI_COPY[key], [copy])
  return {
    t,
    loading: language !== "English" && loadingLanguage === language && !translations[language],
  }
}


// ─── Ashoka Chakra SVG icon ──────────────────────────────────────────────
function ChakraIcon({ className, spinning }: { className?: string; spinning?: boolean }) {
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = ((i * 30 - 90) * Math.PI) / 180
    return {
      x1: parseFloat((12 + 4.3 * Math.cos(a)).toFixed(3)),
      y1: parseFloat((12 + 4.3 * Math.sin(a)).toFixed(3)),
      x2: parseFloat((12 + 9.8 * Math.cos(a)).toFixed(3)),
      y2: parseFloat((12 + 9.8 * Math.sin(a)).toFixed(3)),
    }
  })
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(className, spinning && "[animation:chakra-spin_10s_linear_infinite]")}
    >
      <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      {spokes.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="currentColor" strokeWidth="0.85" />
      ))}
    </svg>
  )
}

// ─── Suggestion prompts ────────────────────────────────────────────────────
const SUGGESTIONS: { key: UiCopyKey; prompt: string; Icon: React.ElementType }[] = [
  { key: "suggestionRegister", prompt: UI_COPY.suggestionRegister, Icon: Vote },
  { key: "suggestionMcc", prompt: UI_COPY.suggestionMcc, Icon: Scale },
  { key: "suggestionNomination", prompt: UI_COPY.suggestionNomination, Icon: FileText },
  { key: "suggestionEvm", prompt: UI_COPY.suggestionEvm, Icon: Cpu },
  { key: "suggestionExpense", prompt: UI_COPY.suggestionExpense, Icon: Banknote },
  { key: "suggestionSchedule", prompt: UI_COPY.suggestionSchedule, Icon: CalendarRange },
]

// ─── SSE stream parser ──────────────────────────────────────────────────────
function parseLine(line: string, msg: Partial<ChatMessage>): Partial<ChatMessage> {
  if (!line?.includes(":")) return msg
  const colon = line.indexOf(":")
  const type  = line.slice(0, colon)
  const raw   = line.slice(colon + 1).trim()
  try {
    const data = JSON.parse(raw)
    switch (type) {
      case "0":
        return { ...msg, content: (msg.content ?? "") + data }
      case "g":
        return { ...msg, thinking: (msg.thinking ?? "") + data }
      case "b": {
        const tc = {
          id: data.toolCallId, name: data.toolName,
          args: {} as Record<string, unknown>, done: false,
        }
        try {
          tc.args = JSON.parse(data.args)
        } catch (error) {
          console.warn("Failed to parse tool call args", error)
        }
        return {
          ...msg,
          thinking: (msg.thinking ?? "") + `\n\n[TOOL_CALL:${data.toolCallId}]\n\n`,
          toolCalls: [...(msg.toolCalls ?? []), tc],
        }
      }
      case "a":
        return {
          ...msg,
          toolCalls: (msg.toolCalls ?? []).map(tc =>
            tc.id === data.toolCallId ? { ...tc, done: true } : tc),
        }
      case "2": {
        const anns = Array.isArray(data) ? data : [data]
        let next = msg
        for (const a of anns) {
          if (a.type === "sources") next = { ...next, sources: a.urls }
        }
        return next
      }
    }
  } catch (error) {
    console.warn("Failed to parse stream line", { line, error })
  }
  return msg
}

// ─── Message ────────────────────────────────────────────────────────────────
function Message({
  msg,
  isStreaming,
  isLastMessage,
  t,
}: {
  msg: ChatMessage
  isStreaming: boolean
  isLastMessage: boolean
  t: (key: UiCopyKey) => string
}) {
  const isUser = msg.role === "user"
  const isThisStreaming = isStreaming && isLastMessage

  if (isUser) {
    return (
      <motion.div
        className="raw-message raw-message-user"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="raw-message-content">
          {msg.content}
        </div>
      </motion.div>
    )
  }

  const hasThinking = !!(msg.thinking || (msg.toolCalls && msg.toolCalls.length > 0))
  const hasResponse = !!msg.content
  const showReasoning = isThisStreaming || hasThinking || msg.workedForMs != null

  return (
    <motion.div
      className="raw-message raw-message-assistant"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="raw-message-content space-y-4">
        {showReasoning && (
          <ThinkingBlock
            content={msg.thinking}
            toolCalls={msg.toolCalls}
            isStreaming={isThisStreaming}
            hasResponse={hasResponse}
            workedForMs={msg.workedForMs}
            labels={{
              working: t("working"),
              reasoned: t("reasoned"),
              reasonedFor: t("reasonedFor"),
              preparingAnswer: t("preparingAnswer"),
              searchingPrefix: t("searchingPrefix"),
              readingPrefix: t("readingPrefix"),
              fetchingSchedule: t("fetchingSchedule"),
              searchResults: t("searchResults"),
              schedule: t("schedule"),
            }}
          />
        )}
        {hasResponse ? (
          <div className={cn("text-[15px] text-foreground break-words", isThisStreaming && "streaming-cursor")}>
            <div className="prose-msg">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ ...props }) => (
                    <a {...props} target="_blank" rel="noreferrer noopener" />
                  ),
                }}
              >
                {sanitizeAssistantContent(msg.content)}
              </ReactMarkdown>
            </div>
          </div>
        ) : !showReasoning && isThisStreaming ? (
          <BlinkText text={t("thinking")} className="text-sm font-medium text-muted-foreground/70" />
        ) : null}
        {msg.sources && (
          <SourceCitations
            urls={msg.sources}
            labels={{
              openSourceReference: t("openSourceReference"),
              openSource: t("openSource"),
              previous: t("previous"),
              next: t("next"),
            }}
          />
        )}
      </div>
    </motion.div>
  )
}

// ─── Greeting ───────────────────────────────────────────────────────────────
function Greeting({
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

// ─── Language dropdown ──────────────────────────────────────────────────────
function LanguageDropdown({
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

// ─── Composer ───────────────────────────────────────────────────────────────
function Composer({
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

// ─── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({
  sessions, currentId, onSelect, onNew, onDelete, onClearAll, mobileOpen, onMobileClose, t,
}: {
  sessions: Session[]
  currentId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onClearAll: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  t: (key: UiCopyKey) => string
}) {
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false
    try {
      return localStorage.getItem("sidebar-collapsed") === "true"
    } catch {
      return false
    }
  })

  const toggleCollapse = () => {
    setCollapsed(v => {
      try {
        localStorage.setItem("sidebar-collapsed", String(!v))
      } catch (error) {
        console.warn("Failed to persist sidebar state", error)
      }
      return !v
    })
  }

  const fade = {
    initial:    { opacity: 0, width: 0 },
    animate:    { opacity: 1, width: "auto" as const },
    exit:       { opacity: 0, width: 0 },
    transition: { duration: 0.2, ease: "easeInOut" as const },
  }

  const handleNew = () => {
    onNew()
    onMobileClose()
  }
  const effectiveCollapsed = collapsed && !mobileOpen

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden",
        "transition-[width,transform] duration-300 ease-in-out",
        "lg:relative",
        effectiveCollapsed ? "w-[52px]" : "w-[240px]",
        mobileOpen ? "translate-x-0 !w-[min(86vw,320px)]" : "-translate-x-full lg:translate-x-0",
      )}>

        {/* Header — always one horizontal row */}
        <div className="flex h-[calc(52px+env(safe-area-inset-top))] shrink-0 items-center border-b border-sidebar-border px-3 pt-[env(safe-area-inset-top)] lg:h-[52px] lg:pt-0">

          {/* Brand — hidden when collapsed */}
          <AnimatePresence initial={false}>
            {!effectiveCollapsed && (
              <motion.button
                {...fade}
                type="button"
                onClick={handleNew}
                title={t("newConversation")}
                className="flex min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-lg p-1 text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--saffron)]/15 ring-1 ring-[color:var(--saffron)]/20">
                  <ChakraIcon className="h-4 w-4 text-[color:var(--saffron)]" />
                </div>
                <span className="whitespace-nowrap font-display text-sm font-bold tracking-tight text-sidebar-foreground">
                  {t("appName")}
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Collapse toggle — always visible on desktop */}
          <button
            type="button"
            onClick={toggleCollapse}
            title={effectiveCollapsed ? t("expandSidebar") : t("collapseSidebar")}
            className="ml-auto hidden shrink-0 cursor-pointer rounded-lg p-1.5 text-sidebar-foreground/35 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
          >
            {effectiveCollapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronLeft className="h-4 w-4" />
            }
          </button>
          <button
            type="button"
            onClick={onMobileClose}
            title={t("closeSidebar")}
            aria-label={t("closeSidebar")}
            className="ml-auto flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* New conversation */}
        <div className="shrink-0 px-2 pt-2 pb-1">
          <button
            type="button"
            onClick={handleNew}
            title={t("newConversation")}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <AnimatePresence initial={false}>
              {!effectiveCollapsed && (
                <motion.span {...fade} className="overflow-hidden whitespace-nowrap">
                  {t("newConversation")}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          {sessions.length > 0 && !effectiveCollapsed && (
            <button
              type="button"
              onClick={onClearAll}
              title={t("clearConversations")}
              aria-label={t("clearConversations")}
              className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span className="overflow-hidden whitespace-nowrap">{t("clearConversations")}</span>
            </button>
          )}
        </div>

        {/* Session list — always rendered, hidden by overflow-hidden + width */}
        <div className={cn("flex-1 overflow-y-auto px-2 py-1", effectiveCollapsed && "hidden")}>
          {sessions.length === 0 && !effectiveCollapsed && (
            <p className="px-3 py-8 text-center text-xs text-sidebar-foreground/55">
              {t("noConversations")}
            </p>
          )}
          {/* mode="popLayout" for smooth add/remove without layout jumps */}
          <AnimatePresence mode="popLayout" initial={false}>
            {!effectiveCollapsed && sessions.map(s => {
              return (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
                className={cn(
                  "group relative flex min-h-11 cursor-pointer items-center rounded-lg py-2 pl-3 pr-11 transition-colors lg:min-h-0 lg:pr-3 lg:group-hover:pr-9",
                  currentId === s.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
                title={stripMarkdown(s.title || t("newConversation"))}
                onClick={() => onSelect(s.id)}
              >
                {currentId === s.id && (
                  <div className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[color:var(--saffron)]" />
                )}
                <div className="flex min-w-0 flex-1 items-center">
                  <span className="truncate text-left text-xs">
                    {stripMarkdown(s.title || t("newConversation"))}
                  </span>
                </div>
                <button
                  type="button"
                  title={t("deleteConversation")}
                  aria-label={t("deleteConversation")}
                  onClick={e => { e.stopPropagation(); onDelete(s.id) }}
                  className="absolute right-2 hidden h-8 w-8 cursor-pointer shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/45 transition-colors hover:text-destructive max-lg:flex lg:h-5 lg:w-5 lg:rounded lg:text-sidebar-foreground/25 lg:group-hover:flex"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </motion.div>
            )})}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className={cn("flex shrink-0 items-center border-t border-sidebar-border px-3 py-3", effectiveCollapsed && "hidden")}>
          <AnimatePresence initial={false}>
            {!effectiveCollapsed && (
              <motion.span
                {...fade}
                className="w-full overflow-hidden whitespace-nowrap text-center text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/65"
              >
                {t("appName")}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </aside>
    </>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [sessions,    setSessions]    = React.useState<Session[]>([])
  const [currentId,   setCurrentId]   = React.useState<string | null>(null)
  const [messages,    setMessages]    = React.useState<ChatMessage[]>([])
  const [input,       setInput]       = React.useState("")
  const [language,    setLanguage]    = React.useState<Language>("English")
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [mobileOpen,  setMobileOpen]  = React.useState(false)
  const abortRef  = React.useRef<AbortController | null>(null)
  const actionRef = React.useRef(false)
  const newChatPromiseRef = React.useRef<Promise<string> | null>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)
  const { t, loading: translationsLoading } = useUiCopy(language)

  // Load sessions on mount
  React.useEffect(() => {
    listSessions().then(setSessions).catch(console.error)
  }, [])

  // Auto-scroll on new messages
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadSession = React.useCallback(async (id: string) => {
    setCurrentId(id)
    setMobileOpen(false)
    setMessages([])
    try {
      const d = await getSession(id)
      setMessages(d.messages.map(m => {
        const storedToolCalls = (m.tool_calls as { calls?: unknown[] } | null)?.calls
        return {
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content ?? "",
          thinking: m.thinking_content ?? undefined,
          toolCalls: Array.isArray(storedToolCalls)
            ? storedToolCalls.map((call, index) => {
                const typedCall = call as {
                  id?: string
                  name?: string
                  args?: Record<string, unknown>
                }
                return {
                  id: typedCall.id ?? `${m.id}-tool-${index}`,
                  name: typedCall.name ?? "tool",
                  args: typedCall.args ?? {},
                  done: true,
                }
              })
            : undefined,
          sources: m.sources ?? undefined,
          workedForMs: m.worked_ms ?? undefined,
        }
      }))
    } catch (e) { console.error("loadSession error:", e) }
  }, [])

  const newChat = React.useCallback(async (): Promise<string> => {
    const s = await createSession()
    setSessions(prev => [s, ...prev])
    setCurrentId(s.id)
    setMessages([])
    return s.id
  }, [])

  const guardedNewChat = React.useCallback((): Promise<string> => {
    if (newChatPromiseRef.current) return newChatPromiseRef.current

    const promise = newChat().finally(() => {
      window.setTimeout(() => {
        newChatPromiseRef.current = null
      }, 500)
    })
    newChatPromiseRef.current = promise
    return promise
  }, [newChat])

  const deleteChat = React.useCallback(async (id: string) => {
    try {
      await deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (currentId === id) { setCurrentId(null); setMessages([]) }
    } catch (e) { console.error("deleteChat error:", e) }
  }, [currentId])

  const clearChats = React.useCallback(async () => {
    if (actionRef.current || isStreaming || sessions.length === 0) return
    actionRef.current = true
    try {
      const ids = sessions.map(session => session.id)
      await Promise.all(ids.map(id => deleteSession(id)))
      setSessions([])
      setCurrentId(null)
      setMessages([])
    } catch (e) {
      console.error("clearChats error:", e)
      listSessions().then(setSessions).catch(console.error)
    } finally {
      actionRef.current = false
    }
  }, [isStreaming, sessions])

  const sendMessage = React.useCallback(async (text: string, sid: string, lang: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text }
    const asstMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "" }
    setMessages(prev => [...prev, userMsg, asstMsg])
    setIsStreaming(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl

    const startTime = Date.now()

    try {
      let latestPartial: Partial<ChatMessage> = { id: asstMsg.id, role: "assistant", content: "" }

      const flushStreamUpdate = () => {
        const snap = { ...latestPartial }
        setMessages(prev => prev.map(m =>
          m.id === asstMsg.id ? { ...m, ...snap } as ChatMessage : m,
        ))
      }

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`${BACKEND_WS_URL}/api/chat/sessions/${sid}/ws`)
        let settled = false
        let closedByAbort = false
        const timeoutId = window.setTimeout(() => {
          closedByAbort = true
          ws.close(4000, "timeout")
          reject(new DOMException("Request timed out", "AbortError"))
        }, 95_000)

        const cleanup = () => {
          window.clearTimeout(timeoutId)
          ctrl.signal.removeEventListener("abort", abortHandler)
        }

        const finish = () => {
          if (settled) return
          settled = true
          cleanup()
          resolve()
        }

        const fail = (error: unknown) => {
          if (settled) return
          settled = true
          cleanup()
          reject(error)
        }

        const abortHandler = () => {
          closedByAbort = true
          ws.close(4000, "aborted")
          fail(new DOMException("Request aborted", "AbortError"))
        }

        ctrl.signal.addEventListener("abort", abortHandler)

        ws.onopen = () => {
          ws.send(JSON.stringify({ message: text, language: lang }))
        }

        ws.onmessage = (event) => {
          void (async () => {
            const payload = String(event.data)
            const lines = payload.split("\n").map((line) => line.trim()).filter(Boolean)
            for (const line of lines) {
              if (line.startsWith("d:")) {
                latestPartial = parseLine(line, latestPartial)
                flushStreamUpdate()
                finish()
                ws.close()
                return
              }
              latestPartial = parseLine(line, latestPartial)
              flushStreamUpdate()
              await yieldToPaint()
            }
          })().catch(fail)
        }

        ws.onerror = () => {
          fail(new Error("WebSocket stream failed"))
        }

        ws.onclose = () => {
          if (!settled && !closedByAbort) finish()
        }
      })

      // Stamp how long the entire turn took
      const workedForMs = Date.now() - startTime
      setMessages(prev => prev.map(m =>
        m.id === asstMsg.id ? { ...m, ...latestPartial, workedForMs } as ChatMessage : m,
      ))
      listSessions().then(setSessions).catch(console.error)
    } catch (e: unknown) {
      const err = e as Error
      if (err.name !== "AbortError") {
        console.error("sendMessage error:", e)
        setMessages(prev => prev.map(m =>
          m.id === asstMsg.id
            ? { ...m, content: t("somethingWrong") }
            : m,
        ))
      } else {
        // Aborted (either user stop or timeout)
        setMessages(prev => prev.map(m =>
          m.id === asstMsg.id && !m.content
            ? { ...m, content: t("requestTimedOut") }
            : m,
        ))
      }
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [t])

  const handleSubmit = async () => {
    if (actionRef.current || isStreaming) return
    const text = input.trim()
    if (!text || isStreaming) return
    actionRef.current = true
    setIsSubmitting(true)
    setInput("")
    try {
      const sid = currentId ?? await guardedNewChat()
      await sendMessage(text, sid, language)
    } catch (e) {
      console.error("handleSubmit error:", e)
    } finally {
      actionRef.current = false
      setIsSubmitting(false)
    }
  }

  const handleSuggest = async (text: string) => {
    if (actionRef.current || isStreaming) return
    actionRef.current = true
    setIsSubmitting(true)
    try {
      const sid = currentId ?? await guardedNewChat()
      await sendMessage(text, sid, language)
    } catch (e) {
      console.error("handleSuggest error:", e)
    } finally {
      actionRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onSelect={loadSession}
        onNew={guardedNewChat}
        onDelete={deleteChat}
        onClearAll={clearChats}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        t={t}
      />

      {/* Main panel */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="flex h-[calc(3rem+env(safe-area-inset-top))] shrink-0 items-center gap-3 border-b border-border px-3 pt-[env(safe-area-inset-top)] lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            title={t("expandSidebar")}
            aria-label={t("expandSidebar")}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ChakraIcon className="h-4 w-4 text-[color:var(--saffron)]" />
            <span className="truncate font-display text-sm font-bold tracking-tight">{t("appName")}</span>
          </div>
          <button
            type="button"
            onClick={() => { void guardedNewChat() }}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground"
            title={t("newConversation")}
            aria-label={t("newConversation")}
          >
            <Plus className="h-5 w-5" />
          </button>
        </header>

        {/* Message area */}
        <div className="message-scroll flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <Greeting onSuggest={handleSuggest} disabled={isStreaming || isSubmitting} t={t} />
          ) : (
            <div className="mx-auto w-full max-w-[920px] px-3 py-5 sm:px-5 sm:py-8">
              {messages.map((m, i) => (
                <Message
                  key={m.id}
                  msg={m}
                  isStreaming={isStreaming}
                  isLastMessage={i === messages.length - 1}
                  t={t}
                />
              ))}
              <div ref={bottomRef} className="h-px" />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 border-t border-border/60 bg-background/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:border-t-0 sm:px-4 sm:pb-5 sm:pt-3">
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isStreaming={isStreaming}
            isSubmitting={isSubmitting}
            onStop={() => { abortRef.current?.abort(); setIsStreaming(false) }}
            language={language}
            onLanguageChange={setLanguage}
            t={t}
            translationsLoading={translationsLoading}
          />
          <p className="mt-2 hidden text-center text-[11px] text-muted-foreground/35 sm:block">
            {t("footerSources")}
          </p>
        </div>
      </div>
    </div>
  )
}
