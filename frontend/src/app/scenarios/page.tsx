/**
 * Election Scenario Explorer — 20 common voter situations with step-by-step resolution guides.
 *
 * All scenarios are based on ECI official processes. Covers registration issues,
 * document problems, special voter provisions, complaints, and day-of guidance.
 */

import { ScenarioExplorer } from "@/components/civic/ScenarioExplorer"
import { PlatformShell } from "@/components/platform/PlatformShell"

export default function ScenariosPage() {
  return (
    <PlatformShell
      title="Election scenario guide"
      description="20 common situations Indian voters face — from name missing on the roll to voting as a person with disability. Each scenario has step-by-step resolution, required documents, official links, and helpline numbers."
    >
      <ScenarioExplorer />
    </PlatformShell>
  )
}
