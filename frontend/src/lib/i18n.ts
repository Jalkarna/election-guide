export const LANGUAGES = [
  "English", "Assamese", "Bengali", "Bodo", "Dogri", "Gujarati", "Hindi",
  "Kannada", "Kashmiri", "Konkani", "Maithili", "Malayalam", "Manipuri",
  "Marathi", "Nepali", "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi",
  "Tamil", "Telugu", "Urdu",
] as const

export type Language = (typeof LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<Language, string> = {
  English: "English",
  Assamese: "অসমীয়া",
  Bengali: "বাংলা",
  Bodo: "बर'",
  Dogri: "डोगरी",
  Gujarati: "ગુજરાતી",
  Hindi: "हिन्दी",
  Kannada: "ಕನ್ನಡ",
  Kashmiri: "کٲشُر",
  Konkani: "कोंकणी",
  Maithili: "मैथिली",
  Malayalam: "മലയാളം",
  Manipuri: "মৈতৈলোন্",
  Marathi: "मराठी",
  Nepali: "नेपाली",
  Odia: "ଓଡ଼ିଆ",
  Punjabi: "ਪੰਜਾਬੀ",
  Sanskrit: "संस्कृतम्",
  Santali: "ᱥᱟᱱᱛᱟᱲᱤ",
  Sindhi: "سنڌي",
  Tamil: "தமிழ்",
  Telugu: "తెలుగు",
  Urdu: "اردو",
}

export const UI_COPY = {
  appName: "ElectionGuide",
  heroTagline: "India's civic AI - verified answers about elections, voter registration, and governance",
  suggestionRegister: "How do I register to vote?",
  suggestionMcc: "What is the Model Code of Conduct?",
  suggestionNomination: "How to file nomination for Lok Sabha?",
  suggestionEvm: "How do EVMs and VVPATs work?",
  suggestionExpense: "What is the voter expenditure limit?",
  suggestionSchedule: "Explain the election schedule process",
  badgeEci: "ECI verified",
  badgeNonPartisan: "Non-partisan",
  badgeIndia: "India focused",
  selectLanguage: "Select response language",
  askPlaceholder: "Ask about voter registration, elections, candidature...",
  stopResponse: "Stop response",
  sendMessage: "Send message",
  newConversation: "New conversation",
  deleteConversation: "Delete conversation",
  clearConversations: "Clear conversations",
  noConversations: "No conversations yet",
  expandSidebar: "Expand sidebar",
  collapseSidebar: "Collapse sidebar",
  closeSidebar: "Close sidebar",
  footerSources: "Sourced from ECI, PIB & Indian law - Always non-partisan",
  thinking: "Thinking",
  working: "Working",
  reasoned: "Reasoned",
  reasonedFor: "Reasoned for {duration}",
  preparingAnswer: "Preparing answer",
  searchingPrefix: "Searching: {query}",
  readingPrefix: "Reading: {url}",
  fetchingSchedule: "Fetching election schedule",
  searchResults: "search results",
  schedule: "schedule",
  openSourceReference: "Open source reference",
  openSource: "Open source {source}",
  previous: "Previous",
  next: "Next",
  somethingWrong: "Something went wrong - please try again.",
  requestTimedOut: "Request timed out - please try again.",
} as const

export type UiCopy = Record<keyof typeof UI_COPY, string>
export type UiCopyKey = keyof UiCopy

export function formatCopy(
  value: string,
  replacements: Record<string, string | number | undefined>,
) {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(replacements[key] ?? ""))
}
