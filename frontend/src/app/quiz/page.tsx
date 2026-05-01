/**
 * Election Knowledge Quiz — 10 ECI-sourced civic literacy questions.
 */

import { QuizEngine } from "@/components/civic/QuizEngine"
import { PlatformShell } from "@/components/platform/PlatformShell"

export default function QuizPage() {
  return (
    <PlatformShell
      title="Civic knowledge quiz"
      description="Test your understanding of Indian elections — EPIC, EVM/VVPAT, voter registration, Model Code of Conduct, and ECI process. 10 questions with detailed explanations for every answer."
    >
      <QuizEngine />
    </PlatformShell>
  )
}
