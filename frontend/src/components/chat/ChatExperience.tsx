"use client"

import * as React from "react"
import { Menu, Plus } from "lucide-react"
import { Composer } from "@/components/chat/Composer"
import { Greeting } from "@/components/chat/Greeting"
import { Message } from "@/components/chat/Message"
import { Sidebar } from "@/components/chat/Sidebar"
import { ChakraIcon } from "@/components/chat/ChakraIcon"
import { createSession, deleteSession, getSession, listSessions, type Session } from "@/lib/api"
import { BACKEND_WS_URL } from "@/lib/config"
import { type Language } from "@/lib/i18n"
import { parseLine, yieldToPaint } from "@/lib/chat-stream"
import type { ChatMessage } from "@/types/chat"
import { useUiCopy } from "@/hooks/useUiCopy"

// ─── Chat experience ────────────────────────────────────────────────────────
export function ChatExperience() {
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
