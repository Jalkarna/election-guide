/**
 * Voting Journey Planner — persona-based step-by-step voter preparation.
 */

import { JourneyPlanner } from "@/components/civic/JourneyPlanner"
import { PlatformShell } from "@/components/platform/PlatformShell"

export default function JourneyPage() {
  return (
    <PlatformShell
      title="Your voting journey"
      description="Select your voter profile and follow a personalised preparation timeline — from registration to casting your vote. Track your progress step by step."
    >
      <JourneyPlanner />
    </PlatformShell>
  )
}
