"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ThinkingBlock } from "@/components/ThinkingBlock"
import { ToolCallChip } from "@/components/ToolCallChip"
import { SourceCitations } from "@/components/SourceCitations"
import { createSession, listSessions, deleteSession, type Session } from "@/lib/api"
import { BACKEND_URL } from "@/lib/config"
import {
  Plus, Trash2, ArrowUp, Moon, Sun, Menu, Square,
  ChevronLeft, ChevronRight,
  Vote, Scale, FileText, Cpu, Banknote, CalendarRange,
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
}

function sanitizeAssistantContent(content: string) {
  let next = content.replace(/\s*\[Source:[^\]]+\]/g, "")
  return next.replace(/\n{3,}/g, "\n\n").trim()
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
const SUGGESTIONS: { text: string; Icon: React.ElementType }[] = [
  { text: "How do I register to vote?",           Icon: Vote },
  { text: "What is the Model Code of Conduct?",   Icon: Scale },
  { text: "How to file nomination for Lok Sabha?", Icon: FileText },
  { text: "How do EVMs and VVPATs work?",          Icon: Cpu },
  { text: "What is the voter expenditure limit?",  Icon: Banknote },
  { text: "Explain the election schedule process", Icon: CalendarRange },
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
      case "0": msg.content  = (msg.content  ?? "") + data; break
      case "g": msg.thinking = (msg.thinking ?? "") + data; break
      case "b": {
        // Any text that came before a tool call is intermediate reasoning
        if (msg.content) {
          msg.thinking = (msg.thinking ?? "") + msg.content + "\n\n"
          msg.content = ""
        }
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

// ─── Message ────────────────────────────────────────────────────────────────
function Message({ msg, isStreaming }: { msg: ChatMessage; isStreaming: boolean }) {
  const isUser = msg.role === "user"

  if (isUser) {
    return (
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-user-bubble px-4 py-2.5 text-sm leading-relaxed text-user-bubble-foreground shadow-[var(--shadow-card)]">
          {msg.content}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex items-start gap-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* AI avatar — sits at top, nudged down to align with first text line */}
      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--saffron)]/15 ring-1 ring-[color:var(--saffron)]/25">
        <ChakraIcon className="h-3.5 w-3.5 text-[color:var(--saffron)]" spinning={isStreaming} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {(msg.content || msg.thinking || (msg.toolCalls && msg.toolCalls.length > 0)) ? (
          <div className="rounded-2xl rounded-tl-sm border border-border/70 bg-card px-4 py-3 shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-3">
              {(msg.thinking || (msg.toolCalls && msg.toolCalls.length > 0)) && (
                <ThinkingBlock content={msg.thinking} toolCalls={msg.toolCalls} isStreaming={isStreaming && !msg.content} />
              )}
              {msg.content && (
                <div className={cn("text-sm text-foreground break-words", isStreaming && "streaming-cursor")}>
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
        ) : isStreaming ? (
          <div className="mt-1 flex h-6 items-center">
            <span className="text-sm font-medium text-muted-foreground/60 animate-pulse">Working...</span>
          </div>
        ) : null}
        {msg.sources && <SourceCitations urls={msg.sources} className="pl-1" />}
      </div>
    </motion.div>
  )
}

// ─── Greeting ───────────────────────────────────────────────────────────────
function Greeting({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <div className="flex flex-col items-center px-4 pt-[13vh] pb-12">
      <div className="w-full max-w-[600px] space-y-8">

        {/* Hero */}
        <motion.div
          className="flex flex-col items-center gap-4 text-center"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Chakra icon with glow */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[color:var(--saffron)] opacity-20 blur-2xl scale-150" />
            <div className="relative flex h-[60px] w-[60px] items-center justify-center rounded-full border border-[color:var(--saffron)]/25 bg-[color:var(--saffron)]/10">
              <ChakraIcon className="h-9 w-9 text-[color:var(--saffron)]" spinning />
            </div>
          </div>

          <div>
            <h1 className="font-display text-[2rem] font-bold leading-none tracking-tight">
              ElectionGuide
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              India&apos;s civic AI — ask anything about elections, verified from official sources
            </p>
          </div>
        </motion.div>

        {/* Suggestion grid */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SUGGESTIONS.map(({ text, Icon }, i) => (
            <motion.button
              key={text}
              type="button"
              onClick={() => onSuggest(text)}
              className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left text-sm font-medium text-foreground shadow-[var(--shadow-card)] transition-all hover:border-[color:var(--saffron)]/60 hover:bg-muted/30 hover:text-foreground hover:shadow-[var(--shadow-float)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.055, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--saffron)] opacity-85 transition-opacity group-hover:opacity-100" />
              <span className="leading-snug text-foreground transition-colors">{text}</span>
            </motion.button>
          ))}
        </div>

        {/* Badges */}
        <motion.div
          className="flex items-center justify-center gap-5 text-[11px] text-muted-foreground/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {["ECI verified", "Non-partisan", "India focused"].map(label => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[color:var(--saffron)] opacity-60" />
              {label}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Composer ───────────────────────────────────────────────────────────────
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
    el.style.height = `${Math.min(el.scrollHeight, 196)}px`
  }, [])

  React.useEffect(() => { resize() }, [value, resize])

  const canSubmit = value.trim().length > 0 && !isStreaming

  return (
    <div className={cn(
      "relative mx-auto w-full max-w-[672px] rounded-2xl border bg-card transition-all duration-200",
      "shadow-[var(--shadow-composer)] border-border",
      "focus-within:border-[color:var(--saffron)]/40 focus-within:shadow-[var(--shadow-composer-focus)]",
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
        placeholder="Ask about voter registration, elections, candidature…"
        rows={1}
        className="w-full resize-none bg-transparent px-4 py-3.5 pr-14 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-h-[52px]"
      />
      <div className="absolute bottom-2.5 right-2.5">
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          >
            <Square className="h-3 w-3 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl transition-all",
              canSubmit
                ? "cursor-pointer bg-[color:var(--saffron)] text-[color:var(--saffron-foreground)] shadow-sm hover:opacity-90"
                : "cursor-not-allowed bg-muted text-muted-foreground/30",
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
      try { localStorage.setItem("sidebar-collapsed", String(!v)) } catch {}
      return !v
    })
  }

  const fade = {
    initial:    { opacity: 0, width: 0 },
    animate:    { opacity: 1, width: "auto" as const },
    exit:       { opacity: 0, width: 0 },
    transition: { duration: 0.2, ease: "easeInOut" as const },
  }

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
        collapsed ? "w-[52px]" : "w-[240px]",
        mobileOpen ? "translate-x-0 !w-[240px]" : "-translate-x-full lg:translate-x-0",
      )}>

        {/* Header — always one horizontal row */}
        <div className="flex h-[52px] shrink-0 items-center border-b border-sidebar-border px-3">

          {/* Brand — hidden when collapsed */}
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.button
                {...fade}
                type="button"
                onClick={onNew}
                title="New conversation"
                className="flex min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-lg p-1 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--saffron)]/15 ring-1 ring-[color:var(--saffron)]/20">
                  <ChakraIcon className="h-4 w-4 text-[color:var(--saffron)]" />
                </div>
                <span className="whitespace-nowrap font-display text-sm font-bold tracking-tight text-sidebar-foreground">
                  ElectionGuide
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Collapse toggle — always visible on desktop */}
          <button
            type="button"
            onClick={toggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="ml-auto hidden shrink-0 cursor-pointer rounded-lg p-1.5 text-sidebar-foreground/35 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
          >
            {collapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronLeft className="h-4 w-4" />
            }
          </button>
        </div>

        {/* New conversation */}
        <div className="shrink-0 px-2 pt-2 pb-1">
          <button
            type="button"
            onClick={onNew}
            title="New conversation"
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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

        {/* Session list — always rendered, hidden by overflow-hidden + width */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {sessions.length === 0 && !collapsed && (
            <p className="px-3 py-8 text-center text-xs text-sidebar-foreground/25">
              No conversations yet
            </p>
          )}
          {/* mode="popLayout" for smooth add/remove without layout jumps */}
          <AnimatePresence mode="popLayout" initial={false}>
            {sessions.map(s => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
                className={cn(
                  "group relative flex cursor-pointer items-center rounded-lg px-3 py-2 transition-colors",
                  currentId === s.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/55 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
                onClick={() => onSelect(s.id)}
              >
                {currentId === s.id && (
                  <div className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[color:var(--saffron)]" />
                )}
                <span className="flex-1 truncate text-xs">
                  {s.title || "New conversation"}
                </span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onDelete(s.id) }}
                  className="ml-1 hidden h-5 w-5 cursor-pointer shrink-0 items-center justify-center rounded text-sidebar-foreground/25 transition-colors hover:text-destructive group-hover:flex"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center border-t border-sidebar-border px-3 py-3">
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                {...fade}
                className="overflow-hidden whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/70"
              >
                PromptWars
              </motion.span>
            )}
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            title="Toggle theme"
            className="ml-auto flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-sidebar-foreground/35 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            {resolvedTheme === "dark"
              ? <Sun className="h-3.5 w-3.5" />
              : <Moon className="h-3.5 w-3.5" />
            }
          </button>
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
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [mobileOpen,  setMobileOpen]  = React.useState(false)
  const abortRef  = React.useRef<AbortController | null>(null)
  const bottomRef = React.useRef<HTMLDivElement>(null)

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
      let partial: Partial<ChatMessage> = { id: asstMsg.id, role: "assistant", content: "" }
      let buf = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split("\n")
        buf = lines.pop() ?? ""
        for (const line of lines) {
          partial = parseLine(line.trim(), partial)
          setMessages(prev => prev.map(m =>
            m.id === asstMsg.id ? { ...m, ...partial } as ChatMessage : m,
          ))
        }
      }
      listSessions().then(setSessions).catch(console.error)
    } catch (e: unknown) {
      if ((e as Error).name !== "AbortError") {
        console.error("sendMessage error:", e)
        setMessages(prev => prev.map(m =>
          m.id === asstMsg.id
            ? { ...m, content: `Something went wrong — please try again.` }
            : m,
        ))
      }
    } finally {
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
    } catch (e) {
      console.error("handleSubmit error:", e)
    }
  }

  const handleSuggest = async (text: string) => {
    if (isStreaming) return
    try {
      const sid = currentId ?? await newChat()
      await sendMessage(text, sid)
    } catch (e) {
      console.error("handleSuggest error:", e)
    }
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
            <span className="font-display text-sm font-bold tracking-tight">ElectionGuide</span>
          </div>
        </header>

        {/* Message area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <Greeting onSuggest={handleSuggest} />
          ) : (
            <div className="mx-auto max-w-[672px] space-y-7 px-4 py-8">
              {messages.map((m, i) => (
                <Message
                  key={m.id}
                  msg={m}
                  isStreaming={isStreaming && i === messages.length - 1}
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
          <p className="mt-2.5 text-center text-[11px] font-medium text-muted-foreground">
            Sourced from ECI, PIB &amp; Indian law · Always non-partisan
          </p>
        </div>
      </div>
    </div>
  )
}
