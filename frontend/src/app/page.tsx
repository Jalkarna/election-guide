import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  GitBranch,
  Landmark,
  LockKeyhole,
  MapPinned,
  Route,
  ShieldCheck,
  Vote,
} from "lucide-react"
import { ChakraIcon } from "@/components/chat/ChakraIcon"
import { platformFeatures, trustPrinciples } from "@/lib/platform-content"

/** Real ECI electoral statistics — source: ECI Annual Report 2024 */
const civicStats = [
  { label: "Registered voters", value: "96.8 Cr+" },
  { label: "Lok Sabha seats", value: "543" },
  { label: "States & UTs", value: "36" },
  { label: "Polling stations", value: "10 L+" },
] as const

const workflowSteps = [
  { label: "Prepare", href: "/readiness", icon: CheckCircle2, desc: "Check voter readiness" },
  { label: "Plan", href: "/journey", icon: Route, desc: "Build your journey" },
  { label: "Vote", href: "/booth", icon: MapPinned, desc: "Day-of booth guide" },
  { label: "Learn", href: "/quiz", icon: BookOpenCheck, desc: "Civic knowledge quiz" },
  { label: "Analyse", href: "/architecture", icon: BarChart3, desc: "Platform insights" },
] as const

const navLinks = [
  { href: "/platform", label: "Platform" },
  { href: "/map", label: "Electoral Map" },
  { href: "/resources", label: "Resources" },
  { href: "/architecture", label: "How it works" },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <ChakraIcon className="h-5 w-5 text-[color:var(--saffron)]" />
            <span className="text-sm tracking-tight">ElectionGuide</span>
          </Link>

          <nav className="hidden items-center gap-0.5 text-xs md:flex">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/assistant"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[color:var(--saffron)] px-3.5 py-2 text-xs font-semibold text-[color:var(--saffron-foreground)] transition-opacity hover:opacity-90"
            >
              Open assistant
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--saffron)]/8 blur-3xl animate-glow-pulse" />
          <div className="absolute right-0 top-1/3 h-[400px] w-[400px] translate-x-1/2 rounded-full bg-blue-600/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[500px] -translate-x-1/4 rounded-full bg-[color:var(--saffron)]/4 blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--saffron)]/25 bg-[color:var(--saffron)]/8 px-3.5 py-1.5 text-xs font-semibold text-[color:var(--saffron)]">
              <ChakraIcon className="h-3 w-3" />
              India&apos;s Civic AI Platform
            </div>

            {/* Headline */}
            <h1 className="animate-fade-up delay-100 font-display text-5xl font-bold leading-[1.08] tracking-tight sm:text-7xl">
              Know your vote.{" "}
              <span
                className="bg-gradient-to-r from-[#ff9933] via-[#ffb347] to-[#ff6600] bg-clip-text text-transparent"
                style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                Own your voice.
              </span>
            </h1>

            {/* Sub */}
            <p className="animate-fade-up delay-200 mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Verified AI chat, voter readiness scores, guided journeys, booth preparation, and civic quizzes — all in one non-partisan platform for Indian elections.
            </p>

            {/* CTAs */}
            <div className="animate-fade-up delay-300 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/assistant"
                className="group inline-flex items-center gap-2 rounded-xl bg-[color:var(--saffron)] px-6 py-3.5 text-sm font-semibold text-[color:var(--saffron-foreground)] shadow-lg shadow-[color:var(--saffron)]/20 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-[color:var(--saffron)]/30 active:scale-[0.98]"
              >
                Start civic assistant
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-6 py-3.5 text-sm font-semibold backdrop-blur transition-all hover:bg-accent hover:border-border active:scale-[0.98]"
              >
                <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                Create free account
              </Link>
            </div>

            {/* Trust badges */}
            <div className="animate-fade-up delay-400 mt-10 flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground/60">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500/70" /> Non-partisan</span>
              <span className="h-3 w-px bg-border/50" />
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--saffron)]/70" /> ECI-grounded answers</span>
              <span className="h-3 w-px bg-border/50" />
              <span className="flex items-center gap-1.5"><Vote className="h-3.5 w-3.5 text-blue-400/70" /> Free to use</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border/40 px-4 sm:px-6 md:grid-cols-4">
          {civicStats.map((stat, i) => (
            <div
              key={stat.label}
              className={`animate-fade-up px-6 py-6 text-center delay-${(i + 1) * 100}`}
            >
              <div className="text-3xl font-bold text-[color:var(--saffron)]">{stat.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Workflow steps ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mb-12 text-center">
          <p className="animate-fade-up mb-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--saffron)]/80">How it works</p>
          <h2 className="animate-fade-up delay-100 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Your complete voting journey
          </h2>
          <p className="animate-fade-up delay-200 mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            From registration to election day — every step covered with AI guidance and official sources.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-5">
          {workflowSteps.map((step, i) => {
            const Icon = step.icon
            return (
              <Link
                key={step.href}
                href={step.href}
                className={`animate-fade-up delay-${(i + 1) * 100} group relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-5 transition-all hover:border-[color:var(--saffron)]/40 hover:bg-card hover:shadow-lg hover:shadow-black/20 active:scale-[0.98]`}
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--saffron)]/10 ring-1 ring-[color:var(--saffron)]/20 transition-all group-hover:bg-[color:var(--saffron)]/15">
                  <Icon className="h-4 w-4 text-[color:var(--saffron)]" />
                </div>
                <div className="mb-1 text-sm font-semibold">{step.label}</div>
                <div className="text-xs leading-relaxed text-muted-foreground">{step.desc}</div>
                <ArrowUpRight className="absolute right-4 top-4 h-3.5 w-3.5 text-muted-foreground/30 transition-all group-hover:text-muted-foreground/60 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── Feature grid ──────────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-card/20 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-xl">
            <p className="animate-fade-up mb-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--saffron)]/80">Platform</p>
            <h2 className="animate-fade-up delay-100 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to vote with confidence
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {platformFeatures.map((feature, i) => {
              const Icon = feature.icon
              return (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className={`animate-fade-up delay-${(i % 4 + 1) * 100} group relative min-h-48 overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-5 transition-all hover:border-[color:var(--saffron)]/35 hover:bg-card hover:shadow-lg hover:shadow-black/20 active:scale-[0.98]`}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[color:var(--saffron)]/0 to-[color:var(--saffron)]/0 opacity-0 transition-all group-hover:from-[color:var(--saffron)]/4 group-hover:opacity-100" />

                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--saffron)]/10 ring-1 ring-[color:var(--saffron)]/20 transition-all group-hover:bg-[color:var(--saffron)]/15">
                        <Icon className="h-4 w-4 text-[color:var(--saffron)]" />
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:text-muted-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </div>
                    <h3 className="mt-5 text-sm font-semibold leading-snug">{feature.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{feature.summary}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Trust section ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="mb-12 text-center">
          <p className="animate-fade-up mb-2 text-xs font-semibold uppercase tracking-widest text-[color:var(--saffron)]/80">Why ElectionGuide</p>
          <h2 className="animate-fade-up delay-100 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Built on trust and transparency
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {trustPrinciples.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className={`animate-fade-up delay-${(i + 1) * 150} rounded-2xl border border-border/50 bg-card/60 p-6`}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--saffron)]/10 ring-1 ring-[color:var(--saffron)]/20">
                  <Icon className="h-5 w-5 text-[color:var(--saffron)]" />
                </div>
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────────────── */}
      <section className="border-t border-border/40">
        <div className="relative mx-auto max-w-6xl overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--saffron)]/6 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Ready to vote with confidence?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Join thousands of Indian voters using ElectionGuide to navigate the electoral process with clarity and confidence.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/assistant"
                className="group inline-flex items-center gap-2 rounded-xl bg-[color:var(--saffron)] px-7 py-3.5 text-sm font-semibold text-[color:var(--saffron-foreground)] shadow-lg shadow-[color:var(--saffron)]/20 transition-all hover:opacity-90 hover:shadow-xl hover:shadow-[color:var(--saffron)]/30 active:scale-[0.98]"
              >
                Start for free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-7 py-3.5 text-sm font-semibold transition-all hover:bg-accent hover:border-border active:scale-[0.98]"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <ChakraIcon className="h-5 w-5 text-[color:var(--saffron)]" />
              <span className="text-sm">ElectionGuide</span>
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} className="hover:text-foreground transition-colors">
                  {link.label}
                </Link>
              ))}
              <Link href="/assistant" className="hover:text-foreground transition-colors">Assistant</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
            </nav>
            <p className="text-[11px] text-muted-foreground/50">
              Non-partisan. Source-first. Free.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
