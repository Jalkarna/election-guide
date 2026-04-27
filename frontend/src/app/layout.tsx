import type { Metadata } from "next"
import { Syne, Lora, DM_Sans } from "next/font/google"
import { ThemeProvider } from "next-themes"
import "./globals.css"

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
})

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  style: ["normal", "italic"],
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "ElectionGuide — India's Civic AI",
  description:
    "Accurate, sourced answers about Indian elections — voter registration, candidature, ECI rules, timelines, and more.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='42' stroke='%23FF9933' stroke-width='8' fill='none'/><circle cx='50' cy='50' r='8' fill='%23FF9933'/></svg>"
        />
      </head>
      <body className={`${syne.variable} ${lora.variable} ${dmSans.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="eg-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
