"use client"

/**
 * @module ScenarioExplorer
 * 20 election scenario cards with detailed step-by-step resolution guides.
 *
 * Each scenario is sourced from ECI official processes and covers the most
 * common situations Indian voters encounter across the electoral lifecycle.
 */

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Clock, ExternalLink, FileText, Phone, X } from "lucide-react"
import { ELECTION_SCENARIOS, type Scenario } from "@/lib/civic-data"

const CATEGORIES = ["All", ...Array.from(new Set(ELECTION_SCENARIOS.map(s => s.category)))]

const categoryBg: Record<string, string> = {
  Registration: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Documents: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  Corrections: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Special Voters": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Complaints: "bg-red-500/10 text-red-400 border-red-500/20",
  Guides: "bg-[color:var(--saffron)]/10 text-[color:var(--saffron)] border-[color:var(--saffron)]/20",
  Rules: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  Candidature: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "Voting Process": "bg-teal-500/10 text-teal-400 border-teal-500/20",
}

/** Detailed scenario drawer */
function ScenarioDetail({
  scenario,
  onClose,
}: {
  scenario: Scenario
  onClose: () => void
}) {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={scenario.title}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border/40 bg-card/95 p-5 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden="true">{scenario.icon}</span>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${categoryBg[scenario.category] ?? "bg-muted text-muted-foreground"}`}>
                {scenario.category}
              </span>
            </div>
            <h2 className="mt-2 text-lg font-bold leading-snug">{scenario.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{scenario.description}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg border border-border/60 p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close scenario"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Steps */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Step-by-step resolution</h3>
            <ol className="space-y-2" aria-label="Resolution steps">
              {scenario.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--saffron)]/15 text-[11px] font-bold text-[color:var(--saffron)] ring-1 ring-[color:var(--saffron)]/25">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium">{step.action}</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Info grid */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border/40 bg-background/50 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <FileText className="h-3 w-3" />
                Documents needed
              </div>
              <ul className="space-y-1">
                {scenario.documents.map(doc => (
                  <li key={doc} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[color:var(--saffron)]/60" />
                    {doc}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border/40 bg-background/50 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Phone className="h-3 w-3" />
                Helpline
              </div>
              <a
                href={`tel:${scenario.helpline.replace(/\D/g, "")}`}
                className="text-lg font-bold text-[color:var(--saffron)] hover:underline"
              >
                {scenario.helpline}
              </a>
              <div className="mt-0.5 text-[11px] text-muted-foreground">ECI Voter Helpline</div>
            </div>

            <div className="rounded-xl border border-border/40 bg-background/50 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock className="h-3 w-3" />
                Timeline
              </div>
              <div className="text-sm font-semibold">{scenario.estimatedTime}</div>
            </div>
          </div>

          {/* Official link */}
          <a
            href={scenario.officialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[color:var(--saffron)] px-5 py-2.5 text-sm font-semibold text-[color:var(--saffron-foreground)] transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Open official ECI portal
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function ScenarioExplorer() {
  const [activeCategory, setActiveCategory] = React.useState("All")
  const [selected, setSelected] = React.useState<Scenario | null>(null)
  const [search, setSearch] = React.useState("")

  const filtered = ELECTION_SCENARIOS.filter(s => {
    const matchCat = activeCategory === "All" || s.category === activeCategory
    const matchSearch = search === "" || s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <>
      {/* Filters */}
      <div className="mb-5 space-y-3">
        <input
          type="search"
          placeholder="Search scenarios…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-xl border border-border/60 bg-background/60 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:border-[color:var(--saffron)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--saffron)]/20 transition-all"
          aria-label="Search scenarios"
        />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                activeCategory === cat
                  ? "border-[color:var(--saffron)]/50 bg-[color:var(--saffron)]/10 text-[color:var(--saffron)]"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        role="list"
        aria-label="Election scenarios"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((scenario, i) => (
            <motion.div
              key={scenario.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
              role="listitem"
            >
              <button
                onClick={() => setSelected(scenario)}
                className="group flex h-full w-full flex-col rounded-2xl border border-border/50 bg-card/60 p-4 text-left transition-all hover:border-[color:var(--saffron)]/40 hover:bg-card hover:shadow-lg hover:shadow-black/20 active:scale-[0.98]"
                aria-label={`Open ${scenario.title} scenario`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="text-2xl" aria-hidden="true">{scenario.icon}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide shrink-0 ${categoryBg[scenario.category] ?? "bg-muted text-muted-foreground"}`}>
                    {scenario.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold leading-snug">{scenario.title}</h3>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                  {scenario.description}
                </p>
                <div className="mt-auto pt-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--saffron)]/80 group-hover:text-[color:var(--saffron)] transition-colors">
                    {scenario.steps.length} steps
                    <ArrowLeft className="h-3 w-3 rotate-180 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <div className="text-3xl mb-2">🔍</div>
          <div className="text-sm">No scenarios match your search.</div>
        </div>
      )}

      {/* Drawer */}
      <AnimatePresence>
        {selected && (
          <ScenarioDetail key={selected.id} scenario={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
