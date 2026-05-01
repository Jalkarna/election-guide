/**
 * Booth Preparation — EVM/VVPAT simulator and day-of polling guide.
 */

import { EVMSimulator } from "@/components/civic/EVMSimulator"
import { PlatformShell } from "@/components/platform/PlatformShell"
import { CheckCircle2, Clock, Info, Phone } from "lucide-react"

const beforeYouGo = [
  {
    title: "Verify your polling station",
    detail: "Confirm your booth address at electoralsearch.eci.gov.in and plan your route.",
  },
  {
    title: "Carry valid photo ID",
    detail: "EPIC (Voter ID) is preferred, but any of the 12 ECI-approved IDs works: Aadhaar, Passport, Driving Licence, PAN card, or others.",
  },
  {
    title: "Know the polling hours",
    detail: "Polling is typically 7:00 AM to 6:00 PM. If you are in the queue before closing time, you must be allowed to vote.",
  },
  {
    title: "No election material inside",
    detail: "Political symbols, party colours, or campaign material must not be brought into the polling station premises.",
  },
]

const pollDay = [
  "Join the queue and wait for your turn.",
  "Present your EPIC or alternate ID to the Polling Officer at the table.",
  "The Polling Officer locates your name in the Electoral Roll Part and marks the register.",
  "Indelible ink is applied to your left index finger.",
  "Enter the screened voting compartment.",
  "Press the button next to your chosen candidate on the Ballot Unit. A beep and red light confirm your vote.",
  "Wait for the VVPAT slip to appear in the transparent window (7 seconds). Verify it shows your candidate's symbol and name.",
  "Leave the booth. Do not photograph or reveal your vote.",
]

export default function BoothPage() {
  return (
    <PlatformShell
      title="Booth preparation — polling day guide"
      description="Practice the EVM voting process interactively, then review the before-you-go checklist and day-of steps so nothing surprises you on polling day."
    >
      <div className="space-y-8">
        {/* EVM Simulator */}
        <section aria-labelledby="evm-heading">
          <h2 id="evm-heading" className="mb-4 text-xl font-bold">
            Interactive EVM & VVPAT Simulator
          </h2>
          <EVMSimulator />
        </section>

        {/* Before you go */}
        <section aria-labelledby="before-heading">
          <h2 id="before-heading" className="mb-4 text-xl font-bold">Before you go</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {beforeYouGo.map((item, i) => (
              <div key={i} className="flex gap-3 rounded-2xl border border-border/50 bg-card/60 p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--saffron)]" />
                <div>
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Polling day steps */}
        <section aria-labelledby="polling-heading">
          <h2 id="polling-heading" className="mb-4 text-xl font-bold">Polling day — step by step</h2>
          <ol className="relative pl-6 space-y-3" aria-label="Polling day steps">
            <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border/40" aria-hidden="true" />
            {pollDay.map((step, i) => (
              <li key={i} className="relative flex items-start gap-3">
                <span
                  className="absolute -left-[18px] flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--saffron)]/15 text-[11px] font-bold text-[color:var(--saffron)] ring-1 ring-[color:var(--saffron)]/25 mt-0.5"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Info panels */}
        <section aria-labelledby="info-heading">
          <h2 id="info-heading" className="mb-4 text-xl font-bold">Key information</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card/60 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--saffron)]" />
              <div>
                <div className="text-sm font-semibold">VVPAT slip is not a receipt</div>
                <div className="mt-0.5 text-xs text-muted-foreground">The slip drops into a sealed box after 7 seconds. This protects ballot secrecy.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card/60 p-4">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--saffron)]" />
              <div>
                <div className="text-sm font-semibold">Voter Helpline: 1950</div>
                <div className="mt-0.5 text-xs text-muted-foreground">Free, in all Indian languages. Call for booth issues, complaints, or to report violations.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-card/60 p-4">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--saffron)]" />
              <div>
                <div className="text-sm font-semibold">48-hour silence period</div>
                <div className="mt-0.5 text-xs text-muted-foreground">All political campaigning stops 48 hours before polling. You may still freely vote.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Accessibility */}
        <section aria-labelledby="access-heading">
          <div className="rounded-2xl border border-border/50 bg-card/60 p-5">
            <h2 id="access-heading" className="mb-3 text-base font-bold">
              Accessibility provisions
            </h2>
            <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <p className="mb-1 font-medium text-foreground">At the polling station</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>All booths must be on the ground floor with a ramp</li>
                  <li>Priority queuing for PwD and senior citizens (75+)</li>
                  <li>Wheelchairs available on request</li>
                  <li>One companion is allowed to assist the voter</li>
                </ul>
              </div>
              <div>
                <p className="mb-1 font-medium text-foreground">Home voting — 85+ and PwD</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>Apply for postal ballot via Form 12D</li>
                  <li>Submit to Returning Officer before the deadline</li>
                  <li>A polling team visits your home on a scheduled date</li>
                  <li>Your vote is sealed and counted on counting day</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PlatformShell>
  )
}
