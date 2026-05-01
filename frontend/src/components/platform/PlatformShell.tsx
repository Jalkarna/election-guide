import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"
import { ChakraIcon } from "@/components/chat/ChakraIcon"
import { platformNav } from "@/lib/platform-content"

export function PlatformShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <ChakraIcon className="h-5 w-5 text-[color:var(--saffron)]" />
            <span className="text-sm tracking-tight">ElectionGuide</span>
          </Link>
          <nav className="flex gap-0.5 overflow-x-auto text-xs">
            {platformNav.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="animate-fade-up max-w-3xl">
          <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-8 text-muted-foreground sm:text-lg">
            {description}
          </p>
          <Link
            href="/assistant"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[color:var(--saffron)] px-4 py-2.5 text-sm font-semibold text-[color:var(--saffron-foreground)] transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Open assistant
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="animate-fade-up delay-200 mt-10">{children}</div>
      </section>
    </div>
  )
}

export function InfoPanel({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/60 p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      <div className="mt-4 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  )
}
