import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

export default function AuthCallbackPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 text-foreground">
      <section className="max-w-md rounded-xl border border-border/70 bg-card p-6 text-center shadow-[var(--shadow-float)]">
        <CheckCircle2 className="mx-auto h-8 w-8 text-[color:var(--saffron)]" />
        <h1 className="mt-4 font-display text-2xl font-bold">Google callback route ready</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          OAuth credentials can point to this route in production. The backend callback endpoint is also available for token exchange wiring.
        </p>
        <Link href="/assistant" className="mt-5 inline-flex rounded-lg bg-[color:var(--saffron)] px-4 py-2 text-sm font-semibold text-[color:var(--saffron-foreground)]">
          Continue
        </Link>
      </section>
    </main>
  )
}
