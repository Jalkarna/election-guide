import type { ChatMessage } from "@/types/chat"

export function yieldToPaint() {
  return new Promise<void>((resolve) => {
    if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => window.setTimeout(resolve, 18))
    } else {
      setTimeout(resolve, 18)
    }
  })
}


export function parseLine(line: string, msg: Partial<ChatMessage>): Partial<ChatMessage> {
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

