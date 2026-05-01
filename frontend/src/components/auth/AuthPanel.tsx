"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, Eye, EyeOff, Loader2, Mail } from "lucide-react"
import { createGoogleDevSession, listAuthProviders, signInWithEmail, signUpWithEmail, type AuthProvider, type AuthSession } from "@/lib/auth"
import { ChakraIcon } from "@/components/chat/ChakraIcon"

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export function AuthPanel({ mode }: { mode: "login" | "signup" }) {
  const [providers, setProviders] = React.useState<AuthProvider[]>([])
  const [session, setSession] = React.useState<AuthSession | null>(null)
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [emailLoading, setEmailLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showPassword, setShowPassword] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [name, setName] = React.useState("")

  React.useEffect(() => {
    listAuthProviders().then(setProviders).catch(() => {})
  }, [])

  const google = providers.find(p => p.name === "google")
  const isLogin = mode === "login"

  const handleGoogle = async () => {
    setGoogleLoading(true)
    setError(null)
    try {
      if (google?.configured && google.authorization_url) {
        window.location.href = google.authorization_url
        return
      }
      const devSession = await createGoogleDevSession()
      setSession(devSession)
      window.localStorage.setItem("eg-auth-token", devSession.token)
    } catch {
      setError("Google sign-in is temporarily unavailable. Please try again.")
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    setEmailLoading(true)
    setError(null)
    try {
      const result = isLogin
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password, name)
      setSession(result)
      window.localStorage.setItem("eg-auth-token", result.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Please try again.")
    } finally {
      setEmailLoading(false)
    }
  }

  if (session) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="animate-scale-in w-full max-w-sm text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <svg className="h-8 w-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold">Welcome, {session.user.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{session.user.email}</p>
          <Link
            href="/assistant"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[color:var(--saffron)] px-5 py-3 text-sm font-semibold text-[color:var(--saffron-foreground)] transition-opacity hover:opacity-90"
          >
            Open assistant
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="mt-4">
            <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to home</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--saffron)]/6 blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-0 left-0 h-[350px] w-[350px] -translate-x-1/3 translate-y-1/3 rounded-full bg-blue-600/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] translate-x-1/3 translate-y-1/3 rounded-full bg-[color:var(--saffron)]/4 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px]">
        {/* Logo */}
        <div className="mb-8 text-center animate-fade-up">
          <Link href="/" className="inline-flex items-center gap-2 font-bold">
            <ChakraIcon className="h-6 w-6 text-[color:var(--saffron)]" />
            <span className="text-base">ElectionGuide</span>
          </Link>
        </div>

        {/* Card */}
        <div className="animate-fade-up delay-100 rounded-2xl border border-border/50 bg-card/70 p-7 shadow-[var(--shadow-float)] backdrop-blur-xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[1.375rem] font-bold tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLogin ? "Sign in to ElectionGuide" : "Join India's civic intelligence platform"}
            </p>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border/70 bg-background/60 px-4 py-2.5 text-sm font-semibold transition-all hover:bg-accent hover:border-border active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
          >
            {googleLoading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <GoogleIcon className="h-4 w-4 shrink-0" />
            }
            Continue with Google
          </button>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/50" />
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/60">or</span>
            <div className="h-px flex-1 bg-border/50" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmail} className="space-y-3">
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="name">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-border/70 bg-background/60 px-3.5 py-2.5 text-sm placeholder:text-muted-foreground/40 transition-all focus:border-[color:var(--saffron)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--saffron)]/20"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-border/70 bg-background/60 pl-10 pr-3.5 py-2.5 text-sm placeholder:text-muted-foreground/40 transition-all focus:border-[color:var(--saffron)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--saffron)]/20"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="password">
                  Password
                </label>
                {isLogin && (
                  <button type="button" className="text-[11px] text-muted-foreground/70 hover:text-foreground transition-colors">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="w-full rounded-xl border border-border/70 bg-background/60 px-3.5 py-2.5 pr-10 text-sm placeholder:text-muted-foreground/40 transition-all focus:border-[color:var(--saffron)]/50 focus:outline-none focus:ring-2 focus:ring-[color:var(--saffron)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={emailLoading || !email || !password}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--saffron)] px-4 py-2.5 text-sm font-semibold text-[color:var(--saffron-foreground)] transition-all hover:opacity-90 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-40"
            >
              {emailLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLogin ? "Sign in" : "Create account"}
              {!emailLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-5 text-center text-xs text-muted-foreground">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link
              href={isLogin ? "/signup" : "/login"}
              className="font-semibold text-foreground underline-offset-2 hover:underline transition-all"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="animate-fade-up delay-200 mt-6 text-center text-[11px] text-muted-foreground/50">
          By continuing, you agree to our{" "}
          <Link href="/" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">Terms</Link>
          {" "}and{" "}
          <Link href="/" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
