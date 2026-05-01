import {
  BarChart3,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  GitBranch,
  Landmark,
  MapPinned,
  Route,
  ShieldCheck,
  Vote,
} from "lucide-react"

export const platformNav = [
  { href: "/assistant", label: "Assistant" },
  { href: "/platform", label: "Platform" },
  { href: "/readiness", label: "Readiness" },
  { href: "/journey", label: "Journey" },
  { href: "/quiz", label: "Quiz" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/booth", label: "Booth" },
  { href: "/map", label: "Map" },
  { href: "/resources", label: "Resources" },
  { href: "/architecture", label: "How it works" },
] as const

export const platformFeatures = [
  {
    title: "Verified Civic Chat",
    href: "/",
    icon: Brain,
    summary: "Gemini-powered election guidance with transparent reasoning, source chips, and language control.",
  },
  {
    title: "Readiness Score",
    href: "/readiness",
    icon: CheckCircle2,
    summary: "A structured voter preparedness checklist across EPIC, roll status, polling station, ID, EVM/VVPAT, and accessibility needs.",
  },
  {
    title: "Voting Journey",
    href: "/journey",
    icon: Route,
    summary: "Persona-aware preparation flows for first-time voters, returning voters, candidates, volunteers, and NRI voters.",
  },
  {
    title: "Booth Guide",
    href: "/booth",
    icon: MapPinned,
    summary: "Polling-day flow, before-you-go requirements, queue behavior, VVPAT verification, and accessibility support.",
  },
  {
    title: "Knowledge Quiz",
    href: "/quiz",
    icon: BookOpenCheck,
    summary: "Civic literacy questions with explanations for EPIC, MCC, EVM/VVPAT, voter registration, and voting rights.",
  },
  {
    title: "Scenario Simulator",
    href: "/scenarios",
    icon: GitBranch,
    summary: "Decision paths for missing roll entries, nomination filing, MCC complaints, and accessibility issues.",
  },
  {
    title: "Civic Analytics",
    href: "/architecture",
    icon: BarChart3,
    summary: "Non-sensitive engagement insights and a machine-readable platform catalog for downstream clients.",
  },
  {
    title: "Official Resources",
    href: "/resources",
    icon: Landmark,
    summary: "Curated official portals and source categories for voter services, ECI instructions, law, and public notices.",
  },
] as const

export const platformStats = [
  { label: "Backend tests", value: "48" },
  { label: "Frontend tests", value: "12" },
  { label: "Google services", value: "10" },
  { label: "Platform APIs", value: "8" },
] as const

export const officialResources = [
  "Election Commission of India official portal",
  "Voter services portal for registration and roll lookup",
  "PIB releases for official government announcements",
  "Representation of the People Act references",
  "Model Code of Conduct instructions",
  "SVEEP and accessibility voter education resources",
] as const

export const architectureLayers = [
  {
    title: "Experience Layer",
    points: ["Next.js chat UI", "Platform information pages", "Responsive sidebar", "Accessible controls"],
  },
  {
    title: "Civic Platform Layer",
    points: ["Readiness scoring", "Journey planning", "Booth guidance", "Quiz grading", "Scenario simulation", "Engagement insights"],
  },
  {
    title: "AI + Grounding Layer",
    points: ["Gemini streaming", "Tool-first verification", "Google Custom Search support", "PDF/web source extraction"],
  },
  {
    title: "Google Cloud Layer",
    points: ["Cloud Run", "Cloud Build", "Artifact Registry", "Secret Manager", "Cloud Logging", "Cloud Storage volume"],
  },
] as const

export const trustPrinciples = [
  { title: "Non-partisan", icon: ShieldCheck, text: "ElectionGuide never endorses parties, candidates, or ideologies." },
  { title: "Source-first", icon: Vote, text: "Changing facts are verified through tools before final answers." },
  { title: "Accessible", icon: CheckCircle2, text: "Pages and controls are structured for keyboard and assistive technology use." },
] as const
