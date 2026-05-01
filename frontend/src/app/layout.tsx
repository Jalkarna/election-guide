import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ElectionGuide — India's Civic AI",
  description: "Accurate, sourced answers about Indian elections — voter registration, EVM/VVPAT, ECI rules, booth guidance, and more. Non-partisan, free, powered by Gemini.",
  keywords: "India elections, voter registration, ECI, EVM, VVPAT, election guide, voter ID, EPIC",
  openGraph: {
    title: "ElectionGuide — India's Civic AI",
    description: "Non-partisan civic intelligence platform for Indian elections. Know your vote, own your voice.",
    type: "website",
    locale: "en_IN",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='42' stroke='%23FF9933' stroke-width='8' fill='none'/><circle cx='50' cy='50' r='8' fill='%23FF9933'/></svg>"
        />
      </head>
      <body className={`${inter.variable} ${inter.className} font-sans antialiased`}>
        {/* Skip navigation for keyboard and assistive technology users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[color:var(--saffron)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-[color:var(--saffron-foreground)] focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>

        <ThemeProvider
          attribute="class"
          forcedTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          storageKey="eg-theme"
        >
          <div id="main-content">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
