"use client"

import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ThinkingBlock } from "@/components/ThinkingBlock"
import { SourceCitations } from "@/components/SourceCitations"
import { sanitizeAssistantContent } from "@/lib/markdown"
import { cn } from "@/lib/utils"
import type { UiCopyKey } from "@/lib/i18n"
import type { ChatMessage } from "@/types/chat"

function BlinkText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("blink-text", className)}>
      {text}
    </span>
  )
}


export function Message({
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

