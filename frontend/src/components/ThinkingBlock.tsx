"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, Search, Globe, CalendarRange } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
  done: boolean
}

interface ThinkingBlockProps {
  content?: string
  toolCalls?: ToolCall[]
  isStreaming: boolean
  hasResponse: boolean
  workedForMs?: number
}

const TOOL_ICON: Record<string, React.ReactNode> = {
  search:                <Search className="h-3 w-3" />,
  fetch_url:             <Globe className="h-3 w-3" />,
  get_election_schedule: <CalendarRange className="h-3 w-3" />,
  render_timeline:       <CalendarRange className="h-3 w-3" />,
}

function toolLabel(tool: ToolCall): string {
  const { name, args } = tool
  if (name === "search")               return `${String(args.query ?? "").slice(0, 55)}`
  if (name === "fetch_url")            return `${String(args.url ?? "").replace(/^https?:\/\//, "").slice(0, 50)}`
  if (name === "get_election_schedule") return "election schedule"
  if (name === "render_timeline")      return "building timeline"
  return name
}

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  const m = Math.floor(ms / 60_000)
  const s = Math.round((ms % 60_000) / 1000)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

type Segment = { kind: "text"; text: string } | { kind: "tool"; toolId: string }

function parseSegments(content: string): Segment[] {
  const segs: Segment[] = []
  const parts = content.split(/\[TOOL_CALL:([^\]]+)\]/)
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const t = parts[i].replace(/^\n+/, "").replace(/\n+$/, "")
      if (t) segs.push({ kind: "text", text: t })
    } else {
      segs.push({ kind: "tool", toolId: parts[i] })
    }
  }
  return segs
}

export function ThinkingBlock({
  content,
  toolCalls,
  isStreaming,
  hasResponse,
  workedForMs,
}: ThinkingBlockProps) {
  const isDone = !isStreaming && hasResponse
  const [expanded, setExpanded] = React.useState(isStreaming)
  const didCollapse = React.useRef(!isStreaming)

  React.useEffect(() => {
    if (isStreaming) {
      setExpanded(true)
      didCollapse.current = false
    }
  }, [isStreaming])

  React.useEffect(() => {
    if (isDone && !didCollapse.current) {
      didCollapse.current = true
      const t = setTimeout(() => setExpanded(false), 700)
      return () => clearTimeout(t)
    }
  }, [isDone])

  const tc = toolCalls ?? []
  const segs = parseSegments(content ?? "")
  const orphans = tc.filter(t => !segs.some(s => s.kind === "tool" && s.toolId === t.id))

  const isEmpty = segs.length === 0 && tc.length === 0

  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className={cn(
          "group flex w-fit items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors select-none",
          "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30",
        )}
      >
        {/* Animated thinking indicator */}
        {isStreaming && !hasResponse ? (
          <span className="flex items-center gap-[3px] mr-0.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="inline-block h-1 w-1 rounded-full bg-[color:var(--saffron)]"
                style={{
                  animation: `thinking-dots 1.4s ease-in-out ${i * 0.16}s infinite`,
                  animationFillMode: "both",
                }}
              />
            ))}
          </span>
        ) : (
          <span
            className="mr-0.5 h-2 w-2 rounded-full border border-current opacity-60 shrink-0"
            style={isDone && workedForMs != null ? {
              background: "var(--saffron)",
              borderColor: "var(--saffron)",
              opacity: "0.7",
            } : {}}
          />
        )}

        <span
          className="text-[11px] font-semibold tracking-wide"
          style={{ fontFamily: "var(--font-syne, ui-sans-serif)" }}
        >
          {isDone && workedForMs != null
            ? `Reasoned · ${formatDuration(workedForMs)}`
            : isStreaming
              ? "Thinking"
              : "Reasoned"}
        </span>

        <ChevronRight
          className={cn(
            "h-3 w-3 opacity-50 transition-transform duration-200",
            expanded && "rotate-90",
          )}
        />
      </button>

      {/* Expandable panel */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="thinking-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.20, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className={cn(
              "rounded-lg bg-muted/20 px-4 py-3",
              "border-l-2 border-l-[color:var(--saffron)]/30",
            )}>
              {isEmpty ? (
                /* Waiting for first tokens */
                <div className="flex gap-1 py-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-[color:var(--saffron)]/40"
                      animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1, 0.8] }}
                      transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.22 }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {segs.map((seg, i) => {
                    if (seg.kind === "text") {
                      return (
                        <div
                          key={i}
                          className="thinking-prose text-[12px] leading-relaxed text-muted-foreground/65"
                        >
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <p className="mb-1.5 last:mb-0">{children}</p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold not-italic text-muted-foreground/90">{children}</strong>
                              ),
                              h1: ({ children }) => (
                                <p className="mb-1 font-semibold not-italic text-muted-foreground/80">{children}</p>
                              ),
                              h2: ({ children }) => (
                                <p className="mb-1 font-semibold not-italic text-muted-foreground/80">{children}</p>
                              ),
                              h3: ({ children }) => (
                                <p className="mb-1 font-medium not-italic text-muted-foreground/75">{children}</p>
                              ),
                            }}
                          >
                            {seg.text}
                          </ReactMarkdown>
                        </div>
                      )
                    }
                    const tool = tc.find(t => t.id === seg.toolId)
                    if (!tool) return null
                    return <ToolChip key={tool.id} tool={tool} />
                  })}
                  {orphans.map(tool => (
                    <ToolChip key={tool.id} tool={tool} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ToolChip({ tool }: { tool: ToolCall }) {
  return (
    <div className={cn(
      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] font-medium",
      "border border-border/50 bg-card/80",
      "transition-colors duration-150",
    )}>
      <span className={cn(
        "shrink-0 rounded p-0.5",
        tool.done
          ? "text-[color:var(--saffron)]/80"
          : "text-muted-foreground/50",
      )}>
        {TOOL_ICON[tool.name] ?? <Search className="h-3 w-3" />}
      </span>

      <span className="flex-1 truncate text-muted-foreground/80 font-mono text-[10.5px]">
        {toolLabel(tool)}
      </span>

      {tool.done ? (
        <span className="shrink-0 text-[9px] font-bold text-emerald-500/60 tracking-wide">done</span>
      ) : (
        <span className="flex gap-[3px] shrink-0">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="inline-block h-1 w-1 rounded-full bg-[color:var(--saffron)]/50"
              style={{ animation: `thinking-dots 1.4s ease-in-out ${i * 0.16}s infinite` }}
            />
          ))}
        </span>
      )}
    </div>
  )
}
