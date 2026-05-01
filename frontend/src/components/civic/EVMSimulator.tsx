"use client"

/**
 * @module EVMSimulator
 * Interactive Electronic Voting Machine and VVPAT simulator.
 *
 * Simulates the authentic 4-phase polling booth experience:
 * 1. Introduction — EVM component explanation
 * 2. Voting — Ballot Unit candidate selection + Control Unit readiness
 * 3. VVPAT — 7-second paper slip verification (per ECI specification)
 * 4. Confirmation — Completion and real-day tips
 *
 * All candidate names and party names are entirely fictional to maintain
 * electoral neutrality per ECI non-partisan guidelines.
 */

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, ChevronRight, Info, RotateCcw, Vote } from "lucide-react"

interface Candidate {
  id: number
  name: string
  party: string
  symbol: string
}

const CANDIDATES: Candidate[] = [
  { id: 1, name: "Priya Deshpande", party: "Jan Seva Dal", symbol: "🌻" },
  { id: 2, name: "Ramesh Nair", party: "Lok Kranti Party", symbol: "🌾" },
  { id: 3, name: "Sunita Mehrotra", party: "Rashtriya Vikas Manch", symbol: "⚡" },
  { id: 4, name: "Deepak Rao", party: "People's Democratic Front", symbol: "🌿" },
  { id: 5, name: "Ananya Krishnan", party: "Nagarik Sena Party", symbol: "🕊️" },
  { id: 6, name: "Mohit Saxena", party: "Gram Swaraj Party", symbol: "🌙" },
  { id: 7, name: "NOTA", party: "None of the Above", symbol: "❌" },
]

type Phase = "intro" | "voting" | "vvpat" | "done"

/** Animated entrance for each simulator phase */
const PhaseWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -16 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
)

export function EVMSimulator() {
  const [phase, setPhase] = React.useState<Phase>("intro")
  const [selectedCandidate, setSelectedCandidate] = React.useState<Candidate | null>(null)
  const [vvpatSeconds, setVvpatSeconds] = React.useState(7)
  const [controlReady, setControlReady] = React.useState(false)

  /** Activate Control Unit after a short polling officer delay */
  const activateControlUnit = React.useCallback(() => {
    setControlReady(false)
    const timer = window.setTimeout(() => setControlReady(true), 1400)
    return () => window.clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    if (phase === "voting") {
      return activateControlUnit()
    }
    if (phase === "vvpat" && selectedCandidate) {
      setVvpatSeconds(7)
      let remaining = 7
      const id = window.setInterval(() => {
        remaining -= 1
        setVvpatSeconds(remaining)
        if (remaining <= 0) {
          window.clearInterval(id)
          window.setTimeout(() => setPhase("done"), 600)
        }
      }, 1000)
      return () => window.clearInterval(id)
    }
  }, [phase, selectedCandidate, activateControlUnit])

  const handleVote = (candidate: Candidate) => {
    if (!controlReady) return
    setSelectedCandidate(candidate)
    setPhase("vvpat")
  }

  const handleReset = () => {
    setPhase("intro")
    setSelectedCandidate(null)
    setVvpatSeconds(7)
    setControlReady(false)
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Interactive EVM & VVPAT Simulator</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Practice before polling day — candidates are fictional for neutrality
          </p>
        </div>
        {phase !== "intro" && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Reset simulator"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {/* Phase indicator */}
      <div className="mb-6 flex items-center gap-1" role="progressbar" aria-label="Simulator progress" aria-valuenow={["intro","voting","vvpat","done"].indexOf(phase) + 1} aria-valuemax={4}>
        {(["intro", "voting", "vvpat", "done"] as Phase[]).map((p, i) => {
          const current = ["intro","voting","vvpat","done"].indexOf(phase)
          const isPast = i < current
          const isCurrent = i === current
          const labels = ["Intro", "Vote", "VVPAT", "Done"]
          return (
            <React.Fragment key={p}>
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                isCurrent ? "bg-[color:var(--saffron)] text-[color:var(--saffron-foreground)]" :
                isPast ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"
              }`}>
                {isPast ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs ${isCurrent ? "text-foreground font-medium" : "text-muted-foreground"}`}>{labels[i]}</span>
              {i < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
            </React.Fragment>
          )
        })}
      </div>

      <AnimatePresence mode="wait">

        {/* ── INTRO ──────────────────────────────────────────────────────── */}
        {phase === "intro" && (
          <PhaseWrapper key="intro">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-border/40 bg-background/50 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                  <span className="text-lg">🗳️</span>
                </div>
                <h3 className="text-sm font-semibold">Ballot Unit (BU)</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  The blue panel with numbered candidate buttons. You press the button next to your chosen candidate. A red light and beep confirm your selection.
                </p>
              </div>
              <div className="rounded-xl border border-border/40 bg-background/50 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
                  <span className="text-lg">⚡</span>
                </div>
                <h3 className="text-sm font-semibold">Control Unit (CU)</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Operated by the Polling Officer. The CU activates the BU for one vote per voter by pressing the &apos;Ballot&apos; button after verifying your identity.
                </p>
              </div>
              <div className="rounded-xl border border-border/40 bg-background/50 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--saffron)]/10 ring-1 ring-[color:var(--saffron)]/20">
                  <span className="text-lg">📋</span>
                </div>
                <h3 className="text-sm font-semibold">VVPAT</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Voter Verified Paper Audit Trail. A paper slip with the candidate symbol, name, and serial number appears for 7 seconds for you to verify before dropping into a sealed box.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl border border-[color:var(--saffron)]/20 bg-[color:var(--saffron)]/5 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--saffron)]" />
              The EVM is tamper-proof, standalone, and not connected to any network. It stores votes in internal memory until counting day.
            </div>

            <button
              onClick={() => setPhase("voting")}
              className="mt-5 flex items-center gap-2 rounded-xl bg-[color:var(--saffron)] px-5 py-2.5 text-sm font-semibold text-[color:var(--saffron-foreground)] transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <Vote className="h-4 w-4" />
              Start EVM Demo
            </button>
          </PhaseWrapper>
        )}

        {/* ── VOTING ─────────────────────────────────────────────────────── */}
        {phase === "voting" && (
          <PhaseWrapper key="voting">
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">

              {/* Ballot Unit */}
              <div className="rounded-2xl border-2 border-blue-500/30 bg-blue-950/20 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">Ballot Unit</div>
                    <div className="text-[11px] text-muted-foreground">Press the button next to your candidate</div>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full transition-all ${controlReady ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-red-400/60"}`} />
                </div>
                <div className="space-y-1.5" role="group" aria-label="Candidate selection">
                  {CANDIDATES.map((candidate) => (
                    <button
                      key={candidate.id}
                      onClick={() => handleVote(candidate)}
                      disabled={!controlReady}
                      aria-label={`Vote for ${candidate.name}, ${candidate.party}`}
                      className="group flex w-full items-center gap-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2.5 text-left transition-all hover:border-blue-400/40 hover:bg-blue-500/10 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.99]"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/20 text-sm font-bold text-blue-300 ring-1 ring-blue-500/30">
                        {candidate.id}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{candidate.symbol}</span>
                          <span className="text-sm font-medium">{candidate.name}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">{candidate.party}</div>
                      </div>
                      <div className="h-4 w-7 rounded border-2 border-blue-400/40 bg-blue-500/10 transition-all group-hover:border-blue-400 group-hover:bg-blue-400/20" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Control Unit */}
              <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-950/20 p-5">
                <div className="mb-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Control Unit</div>
                  <div className="text-[11px] text-muted-foreground">Operated by Polling Officer</div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl bg-background/30 p-3">
                    <div className="text-[11px] text-muted-foreground">Status</div>
                    <div className={`mt-1 text-sm font-semibold ${controlReady ? "text-emerald-400" : "text-amber-400"}`}>
                      {controlReady ? "Ready — Ballot Active" : "Activating…"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl bg-background/30 p-3">
                    <div className={`h-4 w-4 rounded-full border-2 transition-all ${controlReady ? "border-emerald-400 bg-emerald-400/30 shadow-[0_0_10px_rgba(52,211,153,0.4)]" : "border-red-400/40 bg-red-400/10"}`} />
                    <span className="text-xs text-muted-foreground">Ballot light</span>
                  </div>

                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] leading-relaxed text-muted-foreground">
                    The Polling Officer presses &apos;Ballot&apos; after verifying your identity and marking you in the register. This activates the BU for exactly one vote.
                  </div>

                  {!controlReady && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center text-xs text-emerald-400/70"
                    >
                      Polling Officer is activating…
                    </motion.div>
                  )}
                  {controlReady && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center text-xs font-semibold text-emerald-400"
                    >
                      ✓ Cast your vote on the Ballot Unit
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </PhaseWrapper>
        )}

        {/* ── VVPAT ──────────────────────────────────────────────────────── */}
        {phase === "vvpat" && selectedCandidate && (
          <PhaseWrapper key="vvpat">
            <div className="mx-auto max-w-md">
              <div className="mb-4 text-center">
                <div className="text-sm font-semibold text-[color:var(--saffron)]">VVPAT Slip Verification</div>
                <div className="mt-1 text-xs text-muted-foreground">Confirm the slip shows your candidate — it drops in {vvpatSeconds}s</div>
              </div>

              {/* VVPAT machine frame */}
              <div className="rounded-2xl border-2 border-[color:var(--saffron)]/40 bg-background/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--saffron)]/80">VVPAT Window</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--saffron)]" />
                    <span className="text-[11px] text-[color:var(--saffron)]">{vvpatSeconds}s</span>
                  </div>
                </div>

                {/* Slip */}
                <motion.div
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="mx-auto max-w-[260px] rounded-xl border border-dashed border-border bg-white/95 p-4 text-center shadow-lg dark:bg-gray-100/10"
                >
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">ELECTION COMMISSION OF INDIA</div>
                  <div className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">Voter Verified Paper Audit Trail</div>
                  <div className="my-3 text-4xl">{selectedCandidate.symbol}</div>
                  <div className="text-sm font-bold text-gray-800 dark:text-foreground">{selectedCandidate.name}</div>
                  <div className="text-xs text-gray-600 dark:text-muted-foreground">{selectedCandidate.party}</div>
                  <div className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">Candidate S.No: {selectedCandidate.id.toString().padStart(3, "0")}</div>
                </motion.div>

                {/* Progress bar — tricolor */}
                <div className="mt-4 overflow-hidden rounded-full bg-muted/50 h-2">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #FF9933 0%, #FFFFFF 50%, #138608 100%)",
                    }}
                    initial={{ width: "100%" }}
                    animate={{ width: `${(vvpatSeconds / 7) * 100}%` }}
                    transition={{ duration: 0.9, ease: "linear" }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-border/40 bg-background/50 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--saffron)]" />
                If the slip shows the wrong candidate, notify the Presiding Officer immediately before the slip drops. You are entitled to a Tendered Vote to record the discrepancy.
              </div>
            </div>
          </PhaseWrapper>
        )}

        {/* ── DONE ───────────────────────────────────────────────────────── */}
        {phase === "done" && selectedCandidate && (
          <PhaseWrapper key="done">
            <div className="mx-auto max-w-lg text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-2 ring-emerald-500/30"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </motion.div>

              <h3 className="text-xl font-bold">Vote Cast Successfully!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your vote for{" "}
                <span className="font-semibold text-foreground">
                  {selectedCandidate.symbol} {selectedCandidate.name}
                </span>{" "}
                has been recorded. The VVPAT slip has dropped into the sealed box.
              </p>

              <div className="mt-6 grid gap-2 text-left sm:grid-cols-2">
                {[
                  { tip: "Press the button only once", detail: "Multiple presses do not register multiple votes." },
                  { tip: "Ink on left index finger", detail: "Indelible ink prevents double voting across booths." },
                  { tip: "Ballot secrecy protected", detail: "No one can see which button you pressed in the screened booth." },
                  { tip: "VVPAT is sealed after", detail: "The paper slip box is sealed and only opened if a court orders a count." },
                ].map(item => (
                  <div key={item.tip} className="rounded-xl border border-border/40 bg-background/50 p-3">
                    <div className="text-xs font-semibold text-foreground">{item.tip}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{item.detail}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleReset}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border/60 px-5 py-2.5 text-sm font-semibold transition-all hover:bg-accent active:scale-[0.98]"
              >
                <RotateCcw className="h-4 w-4" />
                Try again with a different candidate
              </button>
            </div>
          </PhaseWrapper>
        )}

      </AnimatePresence>
    </div>
  )
}
