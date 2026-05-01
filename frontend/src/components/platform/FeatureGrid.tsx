import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { platformFeatures } from "@/lib/platform-content"

export function FeatureGrid() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {platformFeatures.map((feature, i) => {
        const Icon = feature.icon
        return (
          <Link
            key={feature.href}
            href={feature.href}
            className="group relative min-h-44 overflow-hidden rounded-2xl border border-border/50 bg-card/60 p-5 transition-all hover:border-[color:var(--saffron)]/35 hover:bg-card hover:shadow-lg hover:shadow-black/20 active:scale-[0.98]"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            {/* Hover gradient */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[color:var(--saffron)]/0 to-[color:var(--saffron)]/0 opacity-0 transition-all duration-300 group-hover:from-[color:var(--saffron)]/5 group-hover:opacity-100" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--saffron)]/10 ring-1 ring-[color:var(--saffron)]/20 transition-all group-hover:bg-[color:var(--saffron)]/18">
                  <Icon className="h-4 w-4 text-[color:var(--saffron)]" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:text-muted-foreground group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <h2 className="mt-5 text-sm font-semibold leading-snug">{feature.title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{feature.summary}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
