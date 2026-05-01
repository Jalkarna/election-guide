/**
 * India Electoral Map — all 36 states and union territories with electoral data.
 *
 * Data sourced from ECI and Delimitation Commission of India.
 */

import { IndiaElectoralMap } from "@/components/civic/IndiaElectoralMap"
import { PlatformShell } from "@/components/platform/PlatformShell"

export default function MapPage() {
  return (
    <PlatformShell
      title="India electoral map"
      description="Explore electoral data for all 36 states and union territories — Lok Sabha seats, Rajya Sabha seats, state assembly seats, and registered voter counts. Click any state for the Chief Electoral Officer portal."
    >
      <IndiaElectoralMap />
    </PlatformShell>
  )
}
