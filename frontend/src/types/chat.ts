export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  thinking?: string
  toolCalls?: { id: string; name: string; args: Record<string, unknown>; done: boolean }[]
  sources?: string[]
  workedForMs?: number  // milliseconds the turn took (set after streaming ends)
}

