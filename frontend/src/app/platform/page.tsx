/**
 * Platform overview — all civic tools and features in one place.
 */

import Link from "next/link"
import { ArrowUpRight, Brain, CheckCircle2, GitBranch, Landmark, MapPin, MapPinned, Route, Vote } from "lucide-react"
import { PlatformShell } from "@/components/platform/PlatformShell"
import { JOURNEY_PERSONAS } from "@/lib/civic-data"

const modules = [
  {
    title: "AI Civic Assistant",
    href: "/assistant",
    icon: Brain,
    description: "Ask any election question in English or Indian languages. Answers are grounded in ECI sources with transparent reasoning.",
    badge: "Powered by Gemini",
  },
  {
    title: "Voter Readiness Checklist",
    href: "/readiness",
    icon: CheckCircle2,
    description: "7-item interactive checklist covering EPIC, roll verification, polling station, ID readiness, and accessibility needs.",
    badge: "Interactive",
  },
  {
    title: "Voting Journey Planner",
    href: "/journey",
    icon: Route,
    description: "Personalised step-by-step journey for first-time voters, returning voters, NRIs, PwD voters, and senior citizens.",
    badge: "5 Personas",
  },
  {
    title: "EVM & VVPAT Simulator",
    href: "/booth",
    icon: Vote,
    description: "Practice the 4-step EVM voting process interactively — Ballot Unit, Control Unit, and the 7-second VVPAT verification.",
    badge: "Try it now",
  },
  {
    title: "Scenario Guide",
    href: "/scenarios",
    icon: GitBranch,
    description: "20 common voter situations with step-by-step resolution, required documents, official links, and helpline numbers.",
    badge: "20 Scenarios",
  },
  {
    title: "Electoral Map",
    href: "/map",
    icon: MapPinned,
    description: "All 36 states and union territories with Lok Sabha seats, Rajya Sabha seats, assembly seats, and voter counts.",
    badge: "All 36 States",
  },
  {
    title: "Civic Knowledge Quiz",
    href: "/quiz",
    icon: Landmark,
    description: "10 ECI-sourced questions on EPIC, EVM, Model Code of Conduct, registration, and voting rights — with explanations.",
    badge: "10 Questions",
  },
  {
    title: "Official Resources",
    href: "/resources",
    icon: MapPin,
    description: "12 official ECI and government portals for voter registration, roll search, results, candidate affidavits, and laws.",
    badge: "Official links",
  },
]

export default function PlatformPage() {
  return (
    <PlatformShell
      title="Everything you need to vote with confidence"
      description="ElectionGuide combines a Gemini-powered civic AI with deterministic interactive tools — all grounded in ECI official sources, accessible to every Indian voter."
    >
      <div className="space-y-10">
        {/* Module grid */}
        <section aria-labelledby="modules-heading">
          <h2 id="modules-heading" className="mb-4 text-lg font-bold">Platform modules</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map(mod => {
              const Icon = mod.icon
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className="group relative min-h-44 overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-5 transition-all hover:border-[color:var(--saffron)]/35 hover:bg-card hover:shadow-lg hover:shadow-black/20 active:scale-[0.98]"
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[color:var(--saffron)]/0 to-[color:var(--saffron)]/0 opacity-0 transition-all duration-300 group-hover:from-[color:var(--saffron)]/4 group-hover:opacity-100" aria-hidden="true" />
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--saffron)]/10 ring-1 ring-[color:var(--saffron)]/20">
                        <Icon className="h-4 w-4 text-[color:var(--saffron)]" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:text-muted-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                    <div className="mt-3">
                      <span className="rounded-full bg-[color:var(--saffron)]/8 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--saffron)]">
                        {mod.badge}
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold leading-snug">{mod.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{mod.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Journey personas */}
        <section aria-labelledby="personas-heading">
          <h2 id="personas-heading" className="mb-4 text-lg font-bold">Voter personas supported</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {JOURNEY_PERSONAS.map(persona => (
              <Link
                key={persona.id}
                href="/journey"
                className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card/60 px-4 py-3 transition-all hover:border-[color:var(--saffron)]/35 hover:bg-card active:scale-[0.98]"
                aria-label={`${persona.label} journey`}
              >
                <span className="text-xl" aria-hidden="true">{persona.icon}</span>
                <span className="text-sm font-medium">{persona.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Trust principles */}
        <section aria-labelledby="trust-heading">
          <h2 id="trust-heading" className="mb-4 text-lg font-bold">Platform principles</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              {
                title: "Non-partisan",
                text: "ElectionGuide never endorses any political party, candidate, ideology, or electoral outcome. All content is neutral and based on ECI official processes.",
                icon: "⚖️",
              },
              {
                title: "Source-first",
                text: "Every AI answer cites ECI portals, official notifications, or statutory instruments. You always know where the information comes from.",
                icon: "📋",
              },
              {
                title: "Accessible to all",
                text: "The platform is designed for all Indian voters — keyboard navigable, screen reader compatible, and built for India's diversity of languages and abilities.",
                icon: "🤝",
              },
            ].map(item => (
              <div key={item.title} className="rounded-2xl border border-border/50 bg-card/60 p-5">
                <span className="text-2xl" aria-hidden="true">{item.icon}</span>
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PlatformShell>
  )
}
