/**
 * Voter Readiness — interactive 7-item checklist with animated progress ring.
 */

import { ReadinessChecklist } from "@/components/civic/ReadinessChecklist"
import { PlatformShell } from "@/components/platform/PlatformShell"

export default function ReadinessPage() {
  return (
    <PlatformShell
      title="Voter readiness checklist"
      description="Work through 7 essential preparation steps before election day. Each item is based on ECI requirements and links to the relevant official portal or guide."
    >
      <ReadinessChecklist />
    </PlatformShell>
  )
}
