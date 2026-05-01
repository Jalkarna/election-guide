import { BACKEND_URL } from "./config"

export interface PlatformFeature {
  id: string
  name: string
  description: string
}

export interface ReadinessPayload {
  persona?: string
  has_epic?: boolean
  name_on_roll?: boolean
  knows_polling_station?: boolean
  has_accepted_id?: boolean
  understands_evm_vvpat?: boolean
  needs_accessibility_support?: boolean
}

export async function listPlatformFeatures(): Promise<PlatformFeature[]> {
  const res = await fetch(`${BACKEND_URL}/api/platform/features`)
  if (!res.ok) throw new Error("Failed to load platform features")
  const payload = await res.json()
  return payload.features ?? []
}

export async function scoreReadiness(payload: ReadinessPayload) {
  const res = await fetch(`${BACKEND_URL}/api/platform/readiness`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error("Failed to score voter readiness")
  return res.json()
}

export async function loadQuiz(difficulty = "basic") {
  const res = await fetch(`${BACKEND_URL}/api/platform/quiz?difficulty=${encodeURIComponent(difficulty)}`)
  if (!res.ok) throw new Error("Failed to load quiz")
  return res.json()
}
