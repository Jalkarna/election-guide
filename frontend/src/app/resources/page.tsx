/**
 * Official Resources — curated ECI and government portal directory.
 */

import { ExternalLink, Phone } from "lucide-react"
import { PlatformShell } from "@/components/platform/PlatformShell"
import { OFFICIAL_RESOURCES } from "@/lib/civic-data"

const categories = Array.from(new Set(OFFICIAL_RESOURCES.map(r => r.category)))

const badgeColors: Record<string, string> = {
  "Official ECI": "bg-[color:var(--saffron)]/10 text-[color:var(--saffron)] border-[color:var(--saffron)]/25",
  Official: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  Transparency: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  Legal: "bg-purple-500/10 text-purple-400 border-purple-500/25",
  "ECI Programme": "bg-pink-500/10 text-pink-400 border-pink-500/25",
}

export default function ResourcesPage() {
  return (
    <PlatformShell
      title="Official election resources"
      description="Every link here goes to an official ECI, government, or Parliament portal. Your one-stop directory for Indian election services — registration, roll search, complaints, results, and laws."
    >
      <div className="space-y-8">
        {/* Helpline callout */}
        <div className="flex items-center gap-4 rounded-2xl border border-[color:var(--saffron)]/25 bg-[color:var(--saffron)]/6 p-4">
          <Phone className="h-6 w-6 shrink-0 text-[color:var(--saffron)]" aria-hidden="true" />
          <div>
            <div className="font-semibold">National Voter Helpline</div>
            <div className="text-sm text-muted-foreground">
              Call{" "}
              <a href="tel:1950" className="font-bold text-[color:var(--saffron)] hover:underline">
                1950
              </a>{" "}
              — free, available in all Indian languages, for registration, booth info, complaints, and election day issues.
            </div>
          </div>
        </div>

        {/* Resources by category */}
        {categories.map(cat => (
          <section key={cat} aria-labelledby={`cat-${cat.replace(/\s+/g, "-")}`}>
            <h2 id={`cat-${cat.replace(/\s+/g, "-")}`} className="mb-3 text-base font-bold">
              {cat}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {OFFICIAL_RESOURCES.filter(r => r.category === cat).map(resource => (
                <a
                  key={resource.href}
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-2xl border border-border/50 bg-card/60 p-4 transition-all hover:border-[color:var(--saffron)]/35 hover:bg-card hover:shadow-md active:scale-[0.99]"
                  aria-label={`${resource.title} — opens in new tab`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{resource.title}</span>
                      {resource.badge && (
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeColors[resource.badge] ?? "bg-muted text-muted-foreground border-transparent"}`}>
                          {resource.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {resource.description}
                    </p>
                  </div>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-all group-hover:text-[color:var(--saffron)]" aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>
        ))}

        {/* Source integrity note */}
        <div className="rounded-2xl border border-border/40 bg-card/40 p-4 text-xs text-muted-foreground">
          <strong className="text-foreground">Source integrity:</strong> All links point to official{" "}
          <code className="rounded bg-muted px-1">.gov.in</code>,{" "}
          <code className="rounded bg-muted px-1">.nic.in</code>, or parliament domains.
          ElectionGuide does not link to unofficial or commercially-operated election sites.
        </div>
      </div>
    </PlatformShell>
  )
}
