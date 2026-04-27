"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ThinkingBlock } from "@/components/ThinkingBlock"
import { SourceCitations } from "@/components/SourceCitations"
import { createSession, listSessions, deleteSession, type Session } from "@/lib/api"
import { BACKEND_URL } from "@/lib/config"
import {
  Plus, Trash2, ArrowUp, Moon, Sun, Menu, Square,
  ChevronLeft, ChevronRight,
  Vote, Scale, FileText, Cpu, Banknote, CalendarRange,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: string
  toolCalls?: { id: string; name: string; args: Record<string, unknown>; done: boolean }[]
  sources?: string[]
  workedForMs?: number
}

function sanitizeAssistantContent(content: string) {
  let next = content.replace(/\s*\[Source:[^\]]+\]/g, "")
  next = next.replace(/\s+([,;:.!?])/g, "$1")
  return next.trim()
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/#+\s*/g, "")
    .trim()
}

// ─── Ashoka Chakra SVG ──────────────────────────────────────────────────────
function ChakraIcon({ className, spinning }: { className?: string; spinning?: boolean }) {
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const a = ((i * 15 - 90) * Math.PI) / 180
    const inner = i % 2 === 0 ? 4.8 : 6.2
    return {
      x1: parseFloat((12 + inner * Math.cos(a)).toFixed(3)),
      y1: parseFloat((12 + inner * Math.sin(a)).toFixed(3)),
      x2: parseFloat((12 + 9.6 * Math.cos(a)).toFixed(3)),
      y2: parseFloat((12 + 9.6 * Math.sin(a)).toFixed(3)),
    }
  })
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={cn(className, spinning && "[animation:chakra-spin_12s_linear_infinite]")}
    >
      <circle cx="12" cy="12" r="10.2" stroke="currentColor" strokeWidth="0.9" />
      <circle cx="12" cy="12" r="2.0" fill="currentColor" />
      <circle cx="12" cy="12" r="5.8" stroke="currentColor" strokeWidth="0.5" fill="none" />
      {spokes.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke="currentColor" strokeWidth={i % 2 === 0 ? "0.9" : "0.55"} />
      ))}
    </svg>
  )
}

// ─── SSE stream parser ───────────────────────────────────────────────────────
function parseLine(line: string, msg: Partial<ChatMessage>): Partial<ChatMessage> {
  if (!line?.includes(":")) return msg
  const colon = line.indexOf(":")
  const type  = line.slice(0, colon)
  const raw   = line.slice(colon + 1).trim()
  try {
    const data = JSON.parse(raw)
    switch (type) {
      case "0": msg.content  = (msg.content  ?? "") + data; break
      case "g": msg.thinking = (msg.thinking ?? "") + data; break
      case "b": {
        msg.thinking = (msg.thinking ?? "") + `\n\n[TOOL_CALL:${data.toolCallId}]\n\n`
        const tc = {
          id: data.toolCallId, name: data.toolName,
          args: {} as Record<string, unknown>, done: false,
        }
        try { tc.args = JSON.parse(data.args) } catch {}
        msg.toolCalls = [...(msg.toolCalls ?? []), tc]
        break
      }
      case "a":
        msg.toolCalls = (msg.toolCalls ?? []).map(tc =>
          tc.id === data.toolCallId ? { ...tc, done: true } : tc)
        break
      case "2": {
        const anns = Array.isArray(data) ? data : [data]
        for (const a of anns) {
          if (a.type === "sources") msg.sources = a.urls
        }
        break
      }
    }
  } catch {}
  return msg
}

// ─── Suggestion prompts ──────────────────────────────────────────────────────
const SUGGESTIONS: { text: string; Icon: React.ElementType; sub: string }[] = [
  { text: "Register to vote",          Icon: Vote,          sub: "Eligibility, process & deadlines" },
  { text: "Model Code of Conduct",     Icon: Scale,         sub: "Rules binding parties & candidates" },
  { text: "File a Lok Sabha nomination", Icon: FileText,    sub: "Forms, deposits & deadlines" },
  { text: "How EVMs & VVPATs work",    Icon: Cpu,           sub: "Technology & tamper-proofing" },
  { text: "Candidate expenditure cap", Icon: Banknote,      sub: "Spending limits by constituency" },
  { text: "Election schedule process", Icon: CalendarRange, sub: "Phases, notification & counting" },
]

// ─── Message ─────────────────────────────────────────────────────────────────
function Message({
  msg,
  isStreaming,
  isLastMessage,
}: {
  msg: ChatMessage
  isStreaming: boolean
  isLastMessage: boolean
}) {
  const isUser = msg.role === "user"
  const isThisStreaming = isStreaming && isLastMessage

  if (isUser) {
    return (
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.20, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-user-bubble px-4 py-2.5 text-sm leading-relaxed text-user-bubble-foreground shadow-[var(--shadow-card)]"
          style={{ fontFamily: "var(--font-dm-sans, ui-sans-serif)" }}>
          {msg.content}
        </div>
      </motion.div>
    )
  }

  const hasThinking = !!(msg.thinking || (msg.toolCalls && msg.toolCalls.length > 0))
  const hasResponse = !!msg.content

  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.20, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Avatar */}
      <div className={cn(
        "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        "bg-[color:var(--saffron)]/12 ring-1 ring-[color:var(--saffron)]/25",
        isThisStreaming && "ring-[color:var(--saffron)]/50",
      )}
        style={isThisStreaming ? { animation: "pulse-ring 2s ease-out infinite" } : {}}
      >
        <ChakraIcon
          className="h-4 w-4 text-[color:var(--saffron)]"
          spinning={isThisStreaming}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {(hasThinking || hasResponse) ? (
          <div className={cn(
            "rounded-2xl rounded-tl-sm border border-border/60 bg-card px-5 py-4",
            "shadow-[var(--shadow-message)]",
          )}>
            <div className="flex flex-col gap-3">
              {hasThinking && (
                <ThinkingBlock
                  content={msg.thinking}
                  toolCalls={msg.toolCalls}
                  isStreaming={isThisStreaming}
                  hasResponse={hasResponse}
                  workedForMs={msg.workedForMs}
                />
              )}
              {hasThinking && hasResponse && (
                <div className="h-px bg-border/50" />
              )}
              {hasResponse && (
                <div className={cn("text-foreground break-words", isThisStreaming && "streaming-cursor")}>
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
              )}
            </div>
          </div>
        ) : isThisStreaming ? (
          <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-border/60 bg-card px-5 py-4 shadow-[var(--shadow-message)]">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-[color:var(--saffron)]/50"
                  style={{ animation: `thinking-dots 1.4s ease-in-out ${i * 0.16}s infinite` }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {msg.sources && <SourceCitations urls={msg.sources} />}
      </div>
    </motion.div>
  )
}

// ─── Greeting ────────────────────────────────────────────────────────────────
function Greeting({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center px-4 pt-[11vh] pb-12">
      <div className="w-full max-w-[620px] space-y-10">

        {/* Hero */}
        <motion.div
          className="flex flex-col items-center gap-5 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Chakra icon with layered glow */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[color:var(--saffron)] opacity-15 blur-3xl scale-[2.2]" />
            <div className="absolute inset-0 rounded-full bg-[color:var(--saffron)] opacity-8 blur-xl scale-150" />
            <div className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full border border-[color:var(--saffron)]/20 bg-[color:var(--saffron)]/8">
              <ChakraIcon className="h-[42px] w-[42px] text-[color:var(--saffron)]" spinning />
            </div>
          </div>

          <div className="space-y-2">
            <h1
              className="text-[2.4rem] font-extrabold leading-none tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-syne, ui-sans-serif)" }}
            >
              ElectionGuide
            </h1>
            <p className="text-sm text-muted-foreground/70 max-w-[360px] leading-relaxed"
               style={{ fontFamily: "var(--font-lora, ui-serif)", fontStyle: "italic" }}>
              India&apos;s civic AI — ask anything about elections, verified from official sources
            </p>
          </div>
        </motion.div>

        {/* Suggestion grid */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map(({ text, Icon, sub }, i) => (
            <motion.button
              key={text}
              type="button"
              onClick={() => onSuggest(text)}
              className={cn(
                "group flex cursor-pointer items-start gap-3.5 rounded-xl border border-border bg-card",
                "px-4 py-3.5 text-left shadow-[var(--shadow-card)]",
                "transition-all duration-150",
                "hover:border-[color:var(--saffron)]/40 hover:shadow-[var(--shadow-float)]",
              )}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.05, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--saffron)]/10 text-[color:var(--saffron)] transition-colors group-hover:bg-[color:var(--saffron)]/18">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-snug text-foreground"
                   style={{ fontFamily: "var(--font-syne, ui-sans-serif)" }}>
                  {text}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground/55">
                  {sub}
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          className="flex items-center justify-center gap-6 text-[10.5px] font-medium tracking-wide text-muted-foreground/35 uppercase"
          style={{ fontFamily: "var(--font-syne, ui-sans-serif)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55, duration: 0.4 }}
        >
          {["ECI Verified", "Non-Partisan", "India Focused"].map(label => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[color:var(--saffron)] opacity-50" />
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Composer ────────────────────────────────────────────────────────────────
function Composer({
  value, onChange, onSubmit, isStreaming, onStop,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  isStreaming: boolean
  onStop: () => void
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null)

  const resize = React.useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [])

  React.useEffect(() => { resize() }, [value, resize])

  const canSubmit = value.trim().length > 0 && !isStreaming

  return (
    <div className={cn(
      "relative mx-auto w-full max-w-[680px] rounded-2xl border bg-card transition-all duration-200",
      "shadow-[var(--shadow-composer)] border-border",
      "focus-within:border-[color:var(--saffron)]/35 focus-within:shadow-[var(--shadow-composer-focus)]",
    )}>
      <textarea
        ref={ref}
        value={value}
        onChange={e => { onChange(e.target.value); resize() }}
        onKeyDown={e => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            if (canSubmit) onSubmit()
          }
        }}
        placeholder="Ask about voter registration, elections, ECI rules…"
        rows={1}
        className="w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:outline-none min-h-[52px]"
        style={{ fontFamily: "var(--font-dm-sans, ui-sans-serif)" }}
      />
      <div className="absolute bottom-2.5 right-2.5">
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
              canSubmit
                ? "cursor-pointer bg-[color:var(--saffron)] text-[color:var(--saffron-foreground)] shadow-sm hover:opacity-88 active:scale-95"
                : "cursor-not-allowed bg-muted text-muted-foreground/25",
            )}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({
  sessions, currentId, onSelect, onNew, onDelete, mobileOpen, onMobileClose,
}: {
  sessions: Session[]
  currentId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  mobileOpen: boolean
  onMobileClose: () => void
}) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false
    try { return localStorage.getItem("sidebar-collapsed") === "true" }
    catch { return false }
  })

  const toggleCollapse = () => {
    setCollapsed(v => {
      try { localStorage.setItem("sidebar-collapsed", String(!v)) } catch {}
      return !v
    })
  }

  const fade = {
    initial:    { opacity: 0, width: 0 },
    animate:    { opacity: 1, width: "auto" as const },
    exit:       { opacity: 0, width: 0 },
    transition: { duration: 0.18, ease: "easeInOut" as const },
  }

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
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
        collapsed ? "w-[52px]" : "w-[252px]",
        mobileOpen ? "translate-x-0 !w-[252px]" : "-translate-x-full lg:translate-x-0",
      )}>

        {/* Header */}
        <div className="flex h-[52px] shrink-0 items-center border-b border-sidebar-border px-3">
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.button
                {...fade}
                type="button"
                onClick={onNew}
                title="New conversation"
                className="flex min-w-0 cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg px-1.5 py-1 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--saffron)]/12 ring-1 ring-[color:var(--saffron)]/18">
                  <ChakraIcon className="h-4 w-4 text-[color:var(--saffron)]" />
                </div>
                <span className="whitespace-nowrap text-sm font-bold tracking-tight text-sidebar-foreground"
                      style={{ fontFamily: "var(--font-syne, ui-sans-serif)" }}>
                  ElectionGuide
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={toggleCollapse}
            title={collapsed ? "Expand" : "Collapse"}
            className="ml-auto hidden shrink-0 cursor-pointer rounded-lg p-1.5 text-sidebar-foreground/30 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* New conversation */}
        <div className="shrink-0 px-2 pt-2 pb-1">
          <button
            type="button"
            onClick={onNew}
            title="New conversation"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-sidebar-foreground/45 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            style={{ fontFamily: "var(--font-syne, ui-sans-serif)" }}
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span {...fade} className="overflow-hidden whitespace-nowrap">
                  New conversation
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Divider */}
        {!collapsed && sessions.length > 0 && (
          <div className="mx-3 h-px bg-sidebar-border/60" />
        )}

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 py-1.5">
          {sessions.length === 0 && !collapsed && (
            <p className="px-3 py-8 text-center text-[11px] text-sidebar-foreground/22">
              No conversations yet
            </p>
          )}
          <AnimatePresence mode="popLayout" initial={false}>
            {sessions.map(s => {
              const age = Date.now() - new Date(s.updated_at).getTime()
              const relTime = age < 60_000 ? "just now"
                : age < 3_600_000 ? `${Math.floor(age / 60_000)}m`
                : age < 86_400_000 ? `${Math.floor(age / 3_600_000)}h`
                : `${Math.floor(age / 86_400_000)}d`

              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.16, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                  className={cn(
                    "group relative flex cursor-pointer items-center rounded-lg px-2.5 py-2 transition-colors",
                    currentId === s.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/50 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                  title={stripMarkdown(s.title || "New conversation")}
                  onClick={() => onSelect(s.id)}
                >
                  {currentId === s.id && (
                    <div className="absolute left-0 top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-[color:var(--saffron)]" />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[12px] leading-snug">
                      {stripMarkdown(s.title || "New conversation")}
                    </span>
                    {!collapsed && (
                      <span className="text-[10px] text-sidebar-foreground/28 mt-0.5">{relTime}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onDelete(s.id) }}
                    className="ml-1 hidden h-5 w-5 cursor-pointer shrink-0 items-center justify-center rounded text-sidebar-foreground/20 transition-colors hover:text-destructive group-hover:flex"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center border-t border-sidebar-border px-3 py-3">
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                {...fade}
                className="overflow-hidden whitespace-nowrap text-[9.5px] font-bold uppercase tracking-[0.14em] text-sidebar-foreground/35"
                style={{ fontFamily: "var(--font-syne, ui-sans-serif)" }}
              >
                PromptWars
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title="Toggle theme"
            className="ml-auto flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-sidebar-foreground/30 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            {mounted && (resolvedTheme === "dark"
              ? <Sun className="h-3.5 w-3.5" />
              : <Moon className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [sessions,    setSessions]    = React.useState<Session[]>([])
  const [currentId,   setCurrentId]   = React.useState<string | null>(null)
  const [messages,    setMessages]    = React.useState<ChatMessage[]>([])
  const [input,       setInput]       = React.useState("")
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [mobileOpen,  setMobileOpen]  = React.useState(false)
  const abortRef  = React.useRef<AbortController | null>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    listSessions().then(setSessions).catch(console.error)
  }, [])

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadSession = React.useCallback(async (id: string) => {
    setCurrentId(id)
    setMobileOpen(false)
    setMessages([])
    try {
      const { getSession } = await import("@/lib/api")
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
                const typedCall = call as { id?: string; name?: string; args?: Record<string, unknown> }
                return {
                  id: typedCall.id ?? `${m.id}-tool-${index}`,
                  name: typedCall.name ?? "tool",
                  args: typedCall.args ?? {},
                  done: true,
                }
              })
            : undefined,
          sources: m.sources ?? undefined,
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

  const deleteChat = React.useCallback(async (id: string) => {
    try {
      await deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      if (currentId === id) { setCurrentId(null); setMessages([]) }
    } catch (e) { console.error("deleteChat error:", e) }
  }, [currentId])

  const sendMessage = React.useCallback(async (text: string, sid: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text }
    const asstMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "" }
    setMessages(prev => [...prev, userMsg, asstMsg])
    setIsStreaming(true)

    const ctrl = new AbortController()
    abortRef.current = ctrl
    const timeoutId = setTimeout(() => ctrl.abort(), 95_000)
    const startTime = Date.now()

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/sessions/${sid}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
        signal: ctrl.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body!.getReader()
      const dec    = new TextDecoder()
      const partial: Partial<ChatMessage> = { id: asstMsg.id, role: "assistant", content: "" }
      let buf = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split("\n")
        buf = lines.pop() ?? ""
        for (const line of lines) parseLine(line.trim(), partial)
        // Snapshot after all lines in this chunk are processed.
        // One setMessages call per network chunk avoids React batching
        // swallowing intermediate renders and avoids capturing a mutated ref.
        const snap = { ...partial }
        setMessages(prev => prev.map(m =>
          m.id === asstMsg.id ? { ...m, ...snap } as ChatMessage : m,
        ))
      }

      const workedForMs = Date.now() - startTime
      setMessages(prev => prev.map(m =>
        m.id === asstMsg.id ? { ...m, workedForMs } : m,
      ))
      listSessions().then(setSessions).catch(console.error)
    } catch (e: unknown) {
      const err = e as Error
      if (err.name !== "AbortError") {
        setMessages(prev => prev.map(m =>
          m.id === asstMsg.id
            ? { ...m, content: "Something went wrong — please try again." }
            : m,
        ))
      } else {
        setMessages(prev => prev.map(m =>
          m.id === asstMsg.id && !m.content
            ? { ...m, content: "Request timed out — please try again." }
            : m,
        ))
      }
    } finally {
      clearTimeout(timeoutId)
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [])

  const handleSubmit = async () => {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput("")
    try {
      const sid = currentId ?? await newChat()
      await sendMessage(text, sid)
    } catch (e) { console.error("handleSubmit error:", e) }
  }

  const handleSuggest = async (text: string) => {
    if (isStreaming) return
    try {
      const sid = currentId ?? await newChat()
      await sendMessage(text, sid)
    } catch (e) { console.error("handleSuggest error:", e) }
  }

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <Sidebar
        sessions={sessions}
        currentId={currentId}
        onSelect={loadSession}
        onNew={newChat}
        onDelete={deleteChat}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main panel */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* Mobile top bar */}
        <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <ChakraIcon className="h-4 w-4 text-[color:var(--saffron)]" />
            <span className="text-sm font-bold tracking-tight"
                  style={{ fontFamily: "var(--font-syne, ui-sans-serif)" }}>
              ElectionGuide
            </span>
          </div>
        </header>

        {/* Message area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <Greeting onSuggest={handleSuggest} />
          ) : (
            <div className="mx-auto max-w-[700px] space-y-6 px-4 py-8">
              {messages.map((m, i) => (
                <Message
                  key={m.id}
                  msg={m}
                  isStreaming={isStreaming}
                  isLastMessage={i === messages.length - 1}
                />
              ))}
              <div ref={bottomRef} className="h-px" />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="shrink-0 px-4 pb-5 pt-3">
          <Composer
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            isStreaming={isStreaming}
            onStop={() => { abortRef.current?.abort(); setIsStreaming(false) }}
          />
          <p className="mt-2 text-center text-[10.5px] font-medium text-muted-foreground/35"
             style={{ fontFamily: "var(--font-syne, ui-sans-serif)", letterSpacing: "0.04em" }}>
            Sourced from ECI, PIB &amp; Indian law · Non-partisan
          </p>
        </div>
      </div>
    </div>
  )
}
