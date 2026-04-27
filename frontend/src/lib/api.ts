import { BACKEND_URL } from "./config"
import type { UiCopy } from "./i18n"

export interface Session {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string | null
  thinking_content: string | null
  tool_calls: Record<string, unknown> | null
  sources: string[] | null
  worked_ms: number | null
  created_at: string
}

export interface SessionDetail extends Session {
  messages: ChatMessage[]
}

export async function createSession(): Promise<Session> {
  const res = await fetch(`${BACKEND_URL}/api/chat/sessions`, { method: "POST" })
  if (!res.ok) throw new Error("Failed to create session")
  return res.json()
}

export async function listSessions(): Promise<Session[]> {
  const res = await fetch(`${BACKEND_URL}/api/chat/sessions`)
  if (!res.ok) throw new Error("Failed to list sessions")
  return res.json()
}

export async function getSession(id: string): Promise<SessionDetail> {
  const res = await fetch(`${BACKEND_URL}/api/chat/sessions/${id}`)
  if (!res.ok) throw new Error("Failed to get session")
  return res.json()
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/chat/sessions/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete session")
}

export async function translateUiCopy(language: string, messages: UiCopy): Promise<Partial<UiCopy>> {
  const res = await fetch(`${BACKEND_URL}/api/i18n/translate-ui`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, messages }),
  })
  if (!res.ok) throw new Error("Failed to translate UI")
  return res.json()
}
