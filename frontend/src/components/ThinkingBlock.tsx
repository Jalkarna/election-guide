"use client"

import * as React from "react"
import {
  CalendarRange,
  FileText,
  Globe,
  Loader2,
  Search,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import {
  formatCopy,
  UI_COPY,
  type UiCopy,
} from "@/lib/i18n"
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought"
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
  labels?: Pick<
    UiCopy,
    | "working"
    | "reasoned"
    | "reasonedFor"
    | "preparingAnswer"
    | "searchingPrefix"
    | "readingPrefix"
    | "fetchingSchedule"
    | "searchResults"
    | "schedule"
  >
}

const TOOL_ICON = {
  search: Search,
  fetch_url: Globe,
  get_election_schedule: CalendarRange,
} as const

function BlinkText({ text, className }: { text: string; className?: string }) {
  return <span className={cn("blink-text", className)}>{text}</span>
}

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`
  const m = Math.floor(ms / 60_000)
  const s = Math.round((ms % 60_000) / 1000)
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

type Segment = { kind: "text"; text: string } | { kind: "tool"; toolId: string }
type DetailItem = Segment | { kind: "orphanTool"; tool: ToolCall } | { kind: "status" }

function parseSegments(content: string): Segment[] {
  const segs: Segment[] = []
  const parts = content.split(/\[TOOL_CALL:([^\]]+)\]/)
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      const text = parts[i].replace(/^\n+/, "").replace(/\n+$/, "")
      if (text) segs.push({ kind: "text", text })
    } else {
      segs.push({ kind: "tool", toolId: parts[i] })
    }
  }
  return segs
}

function toolLabel(tool: ToolCall, labels: NonNullable<ThinkingBlockProps["labels"]>): string {
  const { name, args } = tool
  if (name === "search") {
    return formatCopy(labels.searchingPrefix, { query: String(args.query ?? "").slice(0, 80) })
  }
  if (name === "fetch_url") {
    return formatCopy(labels.readingPrefix, {
      url: String(args.url ?? "").replace(/^https?:\/\//, "").slice(0, 80),
    })
  }
  if (name === "get_election_schedule") return labels.fetchingSchedule
  return name
}

function resultBadges(tool: ToolCall, labels: NonNullable<ThinkingBlockProps["labels"]>): string[] {
  if (tool.name === "search") return [labels.searchResults]
  if (tool.name === "fetch_url") {
    const url = String(tool.args.url ?? "")
    if (!url) return []
    try {
      return [new URL(url).hostname]
    } catch {
      return [url.replace(/^https?:\/\//, "").split("/")[0]].filter(Boolean)
    }
  }
  if (tool.name === "get_election_schedule") return [labels.schedule]
  return []
}

function ReasoningText({ text }: { text: string }) {
  return (
    <div className="thinking-prose text-xs leading-relaxed text-muted-foreground/80">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-muted-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => <p className="mb-1.5 font-semibold">{children}</p>,
          h2: ({ children }) => <p className="mb-1.5 font-semibold">{children}</p>,
          h3: ({ children }) => <p className="mb-1 font-medium">{children}</p>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

function ToolStep({
  tool,
  showConnector,
  labels,
}: {
  tool: ToolCall
  showConnector?: boolean
  labels: NonNullable<ThinkingBlockProps["labels"]>
}) {
  const Icon = TOOL_ICON[tool.name as keyof typeof TOOL_ICON] ?? Search
  const badges = resultBadges(tool, labels)

  return (
    <ChainOfThoughtStep
      icon={tool.done ? Icon : Loader2}
      label={toolLabel(tool, labels)}
      status={tool.done ? "complete" : "active"}
      showConnector={showConnector}
      className={!tool.done ? "[&_svg]:animate-spin" : undefined}
    >
      {tool.done && badges.length > 0 && (
        <ChainOfThoughtSearchResults>
          {badges.map((badge) => (
            <ChainOfThoughtSearchResult key={badge}>
              {badge}
            </ChainOfThoughtSearchResult>
          ))}
        </ChainOfThoughtSearchResults>
      )}
    </ChainOfThoughtStep>
  )
}

export function ThinkingBlock({
  content,
  toolCalls,
  isStreaming,
  hasResponse,
  workedForMs,
  labels = UI_COPY,
}: ThinkingBlockProps) {
  const isDone = !isStreaming && hasResponse
  const [open, setOpen] = React.useState(isStreaming)
  const didCollapse = React.useRef(!isStreaming)

  React.useEffect(() => {
    if (isDone && !didCollapse.current) {
      didCollapse.current = true
      const timeout = window.setTimeout(() => setOpen(false), 600)
      return () => window.clearTimeout(timeout)
    }
  }, [isDone])

  const tools = toolCalls ?? []
  const segs = parseSegments(content ?? "")
  const orphanTools = tools.filter(
    (tool) => !segs.some((seg) => seg.kind === "tool" && seg.toolId === tool.id),
  )
  const realDetailItems: DetailItem[] = [
    ...segs.filter((seg) => seg.kind === "text" || tools.some((tool) => tool.id === seg.toolId)),
    ...orphanTools.map((tool) => ({ kind: "orphanTool" as const, tool })),
  ]
  const detailItems: DetailItem[] = realDetailItems.length > 0
    ? realDetailItems
    : isStreaming
      ? [{ kind: "status" }]
      : []
  const hasDetails = detailItems.length > 0

  const headerLabel = isDone && workedForMs != null
    ? formatCopy(labels.reasonedFor, { duration: formatDuration(workedForMs) })
    : isStreaming
      ? labels.working
      : labels.reasoned

  return (
    <ChainOfThought
      open={open}
      onOpenChange={setOpen}
      className="py-1"
    >
      <ChainOfThoughtHeader>
        {isStreaming ? <BlinkText text={headerLabel} /> : headerLabel}
      </ChainOfThoughtHeader>
      {hasDetails && (
        <ChainOfThoughtContent className="space-y-3 pb-1">
          {detailItems.map((seg, index) => {
            const showConnector = index < detailItems.length - 1

            if (seg.kind === "text") {
              return (
                <ChainOfThoughtStep
                  key={`text-${index}`}
                  icon={FileText}
                  label={<ReasoningText text={seg.text} />}
                  status={isStreaming && index === segs.length - 1 ? "active" : "complete"}
                  showConnector={showConnector}
                />
              )
            }

            if (seg.kind === "status") {
              return (
                <ChainOfThoughtStep
                  key="status"
                  icon={FileText}
                  label={<span className="text-muted-foreground/80">{labels.preparingAnswer}</span>}
                  status="active"
                  showConnector={false}
                />
              )
            }

            if (seg.kind === "orphanTool") {
              return <ToolStep key={seg.tool.id} tool={seg.tool} showConnector={showConnector} labels={labels} />
            }

            const tool = tools.find((item) => item.id === seg.toolId)
            return tool ? <ToolStep key={tool.id} tool={tool} showConnector={showConnector} labels={labels} /> : null
          })}
        </ChainOfThoughtContent>
      )}
    </ChainOfThought>
  )
}
