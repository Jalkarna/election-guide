"use client"

/**
 * @module IndiaElectoralMap
 * Interactive India electoral data explorer with all 36 states and UTs.
 *
 * Features:
 * - Zone-based filtering (North/South/East/West/Northeast/UT)
 * - State search
 * - Detailed panel showing LS seats, RS seats, assembly seats, and registered voters
 * - Direct links to each state's Chief Electoral Officer portal
 * - Summary statistics (total seats, total voters)
 */

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ExternalLink, MapPin, Phone, Search, Users, X } from "lucide-react"
import { INDIA_STATES, type StateData } from "@/lib/civic-data"

type Zone = "All" | "North" | "South" | "East" | "West" | "Northeast" | "UT"
const ZONES: Zone[] = ["All", "North", "South", "East", "West", "Northeast", "UT"]

const zoneColors: Record<Zone, string> = {
  All: "bg-border text-muted-foreground",
  North: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  South: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  East: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  West: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  Northeast: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  UT: "bg-[color:var(--saffron)]/15 text-[color:var(--saffron)] border-[color:var(--saffron)]/30",
}

const totalLsSeats = INDIA_STATES.reduce((s, x) => s + x.lsSeats, 0)
const totalRsSeats = INDIA_STATES.reduce((s, x) => s + x.rsSeats, 0)

/** State detail panel */
function StatePanel({ state, onClose }: { state: StateData; onClose: () => void }) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="rounded-2xl border border-[color:var(--saffron)]/30 bg-card p-5 shadow-[var(--shadow-float)]"
      role="complementary"
      aria-label={`${state.name} electoral details`}
    >
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[color:var(--saffron)]" />
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${zoneColors[state.zone as Zone]}`}>
              {state.zone}
            </span>
          </div>
          <h3 className="mt-1 text-lg font-bold">{state.name}</h3>
          <div className="text-xs text-muted-foreground">{state.abbreviation}</div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-border/60 p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Close state details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="rounded-xl bg-background/60 p-3 text-center">
          <div className="text-2xl font-bold text-[color:var(--saffron)]">{state.lsSeats}</div>
          <div className="text-[11px] text-muted-foreground">Lok Sabha seats</div>
        </div>
        <div className="rounded-xl bg-background/60 p-3 text-center">
          <div className="text-2xl font-bold text-blue-400">{state.rsSeats}</div>
          <div className="text-[11px] text-muted-foreground">Rajya Sabha seats</div>
        </div>
        <div className="rounded-xl bg-background/60 p-3 text-center">
          <div className="text-2xl font-bold text-emerald-400">{state.assemblySeats}</div>
          <div className="text-[11px] text-muted-foreground">Assembly seats</div>
        </div>
        <div className="rounded-xl bg-background/60 p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Users className="h-3 w-3 text-purple-400" />
            <div className="text-lg font-bold text-purple-400">{state.registeredVoters}</div>
          </div>
          <div className="text-[11px] text-muted-foreground">Registered voters</div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/40 p-3">
          <Phone className="h-3.5 w-3.5 text-[color:var(--saffron)] shrink-0" />
          <div>
            <div className="text-xs font-medium">Voter Helpline</div>
            <a href="tel:1950" className="text-sm font-bold text-[color:var(--saffron)] hover:underline">1950</a>
          </div>
        </div>

        <a
          href={state.eciLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-xl border border-[color:var(--saffron)]/30 bg-[color:var(--saffron)]/8 px-3 py-2.5 transition-all hover:bg-[color:var(--saffron)]/12"
        >
          <span className="text-xs font-medium text-[color:var(--saffron)]">Chief Electoral Officer, {state.abbreviation}</span>
          <ExternalLink className="h-3.5 w-3.5 text-[color:var(--saffron)]" />
        </a>
      </div>
    </motion.div>
  )
}

export function IndiaElectoralMap() {
  const [zone, setZone] = React.useState<Zone>("All")
  const [search, setSearch] = React.useState("")
  const [selectedState, setSelectedState] = React.useState<StateData | null>(null)

  const filtered = INDIA_STATES.filter(s => {
    const matchZone = zone === "All" || s.zone === zone
    const matchSearch =
      search === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.abbreviation.toLowerCase().includes(search.toLowerCase())
    return matchZone && matchSearch
  })

  return (
    <div>
      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "States & UTs", value: "36" },
          { label: "Lok Sabha seats", value: totalLsSeats.toString() },
          { label: "Rajya Sabha seats", value: totalRsSeats.toString() },
          { label: "Registered voters", value: "96.8 Cr+" },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-border/50 bg-card/60 p-3 text-center">
            <div className="text-xl font-bold text-[color:var(--saffron)]">{stat.value}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mb-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            type="search"
            placeholder="Search states and territories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border/60 bg-background/60 pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-[color:var(--saffron)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--saffron)]/20 transition-all"
            aria-label="Search states"
          />
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by zone">
          {ZONES.map(z => (
            <button
              key={z}
              onClick={() => setZone(z)}
              aria-pressed={zone === z}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                zone === z
                  ? zoneColors[z]
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      {/* Grid + detail panel */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* State cards */}
        <div
          className="grid auto-rows-fr gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
          role="list"
          aria-label="India states and territories"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((state, i) => (
              <motion.div
                key={state.abbreviation}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.02, duration: 0.2 }}
                role="listitem"
              >
                <button
                  onClick={() => setSelectedState(s => s?.abbreviation === state.abbreviation ? null : state)}
                  aria-pressed={selectedState?.abbreviation === state.abbreviation}
                  aria-label={`Select ${state.name}`}
                  className={`group w-full rounded-xl border p-3 text-left transition-all hover:shadow-md active:scale-[0.98] ${
                    selectedState?.abbreviation === state.abbreviation
                      ? "border-[color:var(--saffron)]/50 bg-[color:var(--saffron)]/8 shadow-[0_0_0_1px_var(--saffron,#ff9933)_/_0.2]"
                      : "border-border/50 bg-card/50 hover:border-[color:var(--saffron)]/30 hover:bg-card"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-xs font-bold text-[color:var(--saffron)]">{state.abbreviation}</span>
                    <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${zoneColors[state.zone as Zone]}`}>
                      {state.zone}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium leading-tight">{state.name}</div>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{state.lsSeats} LS</span>
                    <span>·</span>
                    <span>{state.assemblySeats > 0 ? `${state.assemblySeats} Ass.` : "No assembly"}</span>
                  </div>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <MapPin className="mx-auto mb-2 h-8 w-8 opacity-30" />
              <div className="text-sm">No states match your search.</div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="min-h-[200px]">
          <AnimatePresence mode="wait">
            {selectedState ? (
              <StatePanel
                key={selectedState.abbreviation}
                state={selectedState}
                onClose={() => setSelectedState(null)}
              />
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border/40 p-8 text-center"
              >
                <div>
                  <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                  <div className="text-sm text-muted-foreground">
                    Click any state to view electoral details
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ECI quick links */}
      <div className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
        {[
          { label: "Voter Registration", href: "https://voters.eci.gov.in/", desc: "Register or update your voter ID" },
          { label: "Find Your Booth", href: "https://electoralsearch.eci.gov.in/", desc: "Locate your polling station" },
          { label: "Candidate Affidavits", href: "https://affidavit.eci.gov.in/", desc: "Candidate asset and criminal disclosures" },
          { label: "ECI Helpline", href: "tel:1950", desc: "1950 — free, all Indian languages" },
        ].map(link => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="flex flex-col gap-1 rounded-xl border border-border/50 bg-card/50 p-3 transition-all hover:border-[color:var(--saffron)]/30 hover:bg-card"
          >
            <span className="text-sm font-medium">{link.label}</span>
            <span className="text-[11px] text-muted-foreground">{link.desc}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
