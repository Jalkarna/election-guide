import { BACKEND_URL } from "./config"

export interface AuthProvider {
  name: "google"
  configured: boolean
  authorization_url: string | null
  required_env: string[]
  scopes: string[]
}

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar_url: string | null
  provider: string
}

export interface AuthSession {
  token: string
  expires_at: string
  user: AuthUser
}

export async function listAuthProviders(): Promise<AuthProvider[]> {
  const res = await fetch(`${BACKEND_URL}/api/auth/providers`, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load auth providers")
  const data = await res.json() as { providers: AuthProvider[] }
  return data.providers
}

export async function createGoogleDevSession(): Promise<AuthSession> {
  const res = await fetch(`${BACKEND_URL}/api/auth/google/dev`, { method: "POST" })
  if (!res.ok) throw new Error("Failed to create Google session")
  return res.json()
}

export async function signInWithEmail(email: string, password: string): Promise<AuthSession> {
  const res = await fetch(`${BACKEND_URL}/api/auth/email/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error("Sign-in failed. Please check your credentials.")
  return res.json()
}

export async function signUpWithEmail(email: string, password: string, name: string): Promise<AuthSession> {
  const res = await fetch(`${BACKEND_URL}/api/auth/email/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  })
  if (!res.ok) throw new Error("Account creation failed. Please try again.")
  return res.json()
}
