"use client"

import * as React from "react"
import { translateUiCopy } from "@/lib/api"
import { UI_COPY, type Language, type UiCopy, type UiCopyKey } from "@/lib/i18n"

export function useUiCopy(language: Language) {
  const [translations, setTranslations] = React.useState<Partial<Record<Language, UiCopy>>>({})
  const [loadingLanguage, setLoadingLanguage] = React.useState<Language | null>(null)

  React.useEffect(() => {
    let cancelled = false

    if (language === "English") {
      return
    }

    if (translations[language]) return

    const cacheKey = `electionguide-ui-copy:${language}:v2`

    window.queueMicrotask(() => {
      if (cancelled) return

      try {
        const cached = window.localStorage.getItem(cacheKey)
        if (cached) {
          const nextCopy = { ...UI_COPY, ...JSON.parse(cached) }
          setTranslations(prev => ({ ...prev, [language]: nextCopy }))
          return
        }
      } catch (error) {
        console.warn("Failed to read translated UI cache", error)
      }

      setLoadingLanguage(language)
      translateUiCopy(language, UI_COPY)
        .then(translated => {
          if (cancelled) return
          const nextCopy = { ...UI_COPY, ...translated }
          setTranslations(prev => ({ ...prev, [language]: nextCopy }))
          try {
            window.localStorage.setItem(cacheKey, JSON.stringify(translated))
          } catch (error) {
            console.warn("Failed to cache translated UI", error)
          }
        })
        .catch(error => {
          if (!cancelled) {
            console.error("translateUiCopy error:", error)
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoadingLanguage(current => current === language ? null : current)
          }
        })
    })

    return () => {
      cancelled = true
    }
  }, [language, translations])

  const copy = language === "English" ? UI_COPY : (translations[language] ?? UI_COPY)
  const t = React.useCallback((key: UiCopyKey) => copy[key] ?? UI_COPY[key], [copy])
  return {
    t,
    loading: language !== "English" && loadingLanguage === language && !translations[language],
  }
}


