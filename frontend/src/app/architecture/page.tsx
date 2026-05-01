/**
 * About ElectionGuide — technical transparency page.
 *
 * This page explains how the platform works, which Google Cloud services it uses,
 * and how it maintains accuracy, neutrality, and security. It is aimed at
 * citizens who want to understand the technology behind their civic tool.
 */

import { PlatformShell } from "@/components/platform/PlatformShell"
import { CloudCog, Lock, MessageSquare, Server, Shield, ShieldCheck } from "lucide-react"

const googleServices = [
  {
    name: "Gemini (Google AI)",
    role: "Streaming AI answers for the civic assistant with citation and source grounding",
    badge: "AI & Answers",
    icon: "🤖",
  },
  {
    name: "Cloud Run",
    role: "Serverless auto-scaling deployment for the FastAPI backend and Next.js frontend",
    badge: "Deployment",
    icon: "☁️",
  },
  {
    name: "Cloud Build",
    role: "Continuous integration and deployment pipeline with automated testing gates",
    badge: "CI / CD",
    icon: "🔧",
  },
  {
    name: "Secret Manager",
    role: "Secure storage for OAuth credentials, API keys, and environment secrets",
    badge: "Security",
    icon: "🔑",
  },
  {
    name: "Cloud Logging",
    role: "Structured application and access logs for monitoring, debugging, and audit trails",
    badge: "Observability",
    icon: "📊",
  },
  {
    name: "Cloud Storage",
    role: "Persistent volume for session data, civic reference documents, and static assets",
    badge: "Storage",
    icon: "🗄️",
  },
  {
    name: "Firestore",
    role: "Audit event persistence for AI interactions and platform usage analytics",
    badge: "Audit",
    icon: "📁",
  },
  {
    name: "Cloud Artifact Registry",
    role: "Container image registry for the backend and frontend Docker images",
    badge: "Registry",
    icon: "📦",
  },
]

const techLayers = [
  {
    title: "Civic experience layer",
    icon: MessageSquare,
    points: [
      "Next.js 16 with React 19 and TypeScript",
      "Server and client components for optimal performance",
      "Framer Motion animations for interactive civic tools",
      "Tailwind CSS with India tricolor design tokens",
      "Fully accessible — WCAG 2.1 AA compliant",
    ],
  },
  {
    title: "AI and grounding layer",
    icon: CloudCog,
    points: [
      "Gemini 2.0 Flash Experimental with streaming",
      "Google Search grounding for real-time ECI information",
      "Tool-first verification before answering",
      "Non-partisan system prompt enforced at model level",
      "WebSocket streaming for low-latency responses",
    ],
  },
  {
    title: "API and data layer",
    icon: Server,
    points: [
      "FastAPI (Python) with async SQLAlchemy and SQLite",
      "Real-time WebSocket chat with session persistence",
      "Google OAuth 2.0 authentication",
      "20+ civic platform API endpoints",
      "Structured audit logging to Firestore",
    ],
  },
  {
    title: "Security layer",
    icon: Shield,
    points: [
      "Security headers: X-Frame-Options, X-Content-Type-Options, HSTS",
      "Rate limiting: 45 requests / minute per IP on chat endpoints",
      "Input validation with length and content checks",
      "Secrets stored in Google Secret Manager — never in code",
      "CORS restricted to known origins only",
    ],
  },
]

export default function ArchitecturePage() {
  return (
    <PlatformShell
      title="How ElectionGuide works"
      description="Transparency about the technology powering your civic assistant — the AI models, Google Cloud services, security architecture, and the principles that keep every answer non-partisan and source-grounded."
    >
      <div className="space-y-10">
        {/* Google Cloud services */}
        <section aria-labelledby="gcp-heading">
          <h2 id="gcp-heading" className="mb-4 text-lg font-bold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[color:var(--saffron)]" />
            Google Cloud services
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {googleServices.map(svc => (
              <div key={svc.name} className="rounded-2xl border border-border/50 bg-card/60 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <span className="text-2xl" aria-hidden="true">{svc.icon}</span>
                  <span className="rounded-full bg-[color:var(--saffron)]/8 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--saffron)]">
                    {svc.badge}
                  </span>
                </div>
                <div className="text-sm font-semibold">{svc.name}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{svc.role}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Technical architecture */}
        <section aria-labelledby="tech-heading">
          <h2 id="tech-heading" className="mb-4 text-lg font-bold flex items-center gap-2">
            <Server className="h-5 w-5 text-[color:var(--saffron)]" />
            Technical architecture
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {techLayers.map(layer => {
              const Icon = layer.icon
              return (
                <div key={layer.title} className="rounded-2xl border border-border/50 bg-card/60 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[color:var(--saffron)]" />
                    <h3 className="font-semibold">{layer.title}</h3>
                  </div>
                  <ul className="space-y-1.5">
                    {layer.points.map(point => (
                      <li key={point} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--saffron)]/60" aria-hidden="true" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </section>

        {/* AI neutrality commitment */}
        <section aria-labelledby="neutral-heading">
          <div className="rounded-2xl border border-border/50 bg-card/60 p-6">
            <h2 id="neutral-heading" className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Lock className="h-5 w-5 text-[color:var(--saffron)]" />
              AI neutrality and accuracy commitment
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-sm text-muted-foreground">
              <div>
                <p className="mb-2 font-semibold text-foreground">What the AI will never do</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Endorse or criticise any political party or candidate</li>
                  <li>Make predictions about election outcomes</li>
                  <li>Express opinions on electoral or legislative policy</li>
                  <li>Spread unverified claims about election processes</li>
                </ul>
              </div>
              <div>
                <p className="mb-2 font-semibold text-foreground">What every AI answer includes</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>A grounding check against ECI official sources</li>
                  <li>Citations to specific portals or official documents</li>
                  <li>A clear next step for the voter to take</li>
                  <li>Consistent language across all Indian languages</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PlatformShell>
  )
}
