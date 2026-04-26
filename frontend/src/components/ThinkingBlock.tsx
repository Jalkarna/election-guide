"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ToolCallChip } from "@/components/ToolCallChip"

interface ThinkingBlockProps {
  content?: string
  toolCalls?: { id: string; name: string; args: Record<string, unknown>; done: boolean }[]
  isStreaming?: boolean
  className?: string
}

export function ThinkingBlock({ content = "", toolCalls = [], isStreaming = false, className }: ThinkingBlockProps) {
  const [open, setOpen] = React.useState(true)

  React.useEffect(() => {
    if (!isStreaming) {
      setOpen(false)
    }
  }, [isStreaming])

  if (!content && toolCalls.length === 0) return null

  const tokenCount = Math.ceil(content.length / 4)

  const parts: { type: 'text' | 'tool', value: string }[] = []
  if (content) {
    const regex = /\[TOOL_CALL:([^\]]+)\]/g
    let lastIndex = 0
    let match

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: content.substring(lastIndex, match.index) })
      }
      parts.push({ type: 'tool', value: match[1] })
      lastIndex = regex.lastIndex
    }
    
    if (lastIndex < content.length) {
      parts.push({ type: 'text', value: content.substring(lastIndex) })
    }
  }

  const renderedToolCallIds = new Set(parts.filter(p => p.type === 'tool').map(p => p.value))
  const remainingToolCalls = toolCalls.filter(tc => !renderedToolCallIds.has(tc.id))

  return (
    <div className={cn("w-full overflow-hidden rounded-xl border border-border/30 bg-muted/10", className)}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/30"
      >
        {isStreaming ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-muted-foreground/70" />
            <span className="text-[13px] font-medium text-muted-foreground/80">Thinking</span>
          </>
        ) : (
          <>
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
            <span className="text-[13px] font-medium text-muted-foreground/80">Reasoning</span>
            <span className="text-xs text-muted-foreground/40">· {tokenCount} tokens</span>
          </>
        )}
        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/30 px-3 py-3 max-h-[400px] overflow-y-auto space-y-3">
              {parts.length > 0 && (
                <div className="space-y-3">
                  {parts.map((part, i) => {
                    if (part.type === 'text') {
                      if (!part.value.trim()) return null
                      return (
                        <div key={i} className="prose-msg text-[13px] text-muted-foreground/80">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {part.value}
                          </ReactMarkdown>
                        </div>
                      )
                    } else {
                      const tc = toolCalls.find(t => t.id === part.value)
                      if (!tc) return null
                      return (
                        <div key={i} className="flex flex-wrap gap-1.5">
                          <ToolCallChip toolName={tc.name} args={tc.args} isRunning={!tc.done} />
                        </div>
                      )
                    }
                  })}
                </div>
              )}
              {remainingToolCalls.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {remainingToolCalls.map(tc => (
                    <ToolCallChip key={tc.id} toolName={tc.name} args={tc.args} isRunning={!tc.done} />
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
