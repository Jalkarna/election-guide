"use client"

import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationCarousel,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselItem,
  InlineCitationCarouselNext,
  InlineCitationCarouselPrev,
  InlineCitationSource,
} from "@/components/ai-elements/inline-citation"
import { cn } from "@/lib/utils"
import { formatCopy } from "@/lib/i18n"

interface SourceCitationLabels {
  openSourceReference: string
  openSource: string
  previous: string
  next: string
}

function sourceTitle(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] || "Source"
  }
}

export function SourceCitations({
  urls,
  className,
  labels = {
    openSourceReference: "Open source reference",
    openSource: "Open source {source}",
    previous: "Previous",
    next: "Next",
  },
}: {
  urls: string[]
  className?: string
  labels?: SourceCitationLabels
}) {
  const sources = Array.from(new Set(urls ?? [])).filter(Boolean)
  if (!sources.length) return null

  return (
    <InlineCitation className={cn("pt-0.5", className)}>
      <InlineCitationCard>
        <InlineCitationCardTrigger
          sources={sources}
          ariaLabel={formatCopy(labels.openSource, { source: sourceTitle(sources[0]) })}
        />
        <InlineCitationCardBody>
          <InlineCitationCarousel>
            <InlineCitationCarouselHeader>
              <InlineCitationCarouselPrev aria-label={labels.previous} />
              <InlineCitationCarouselIndex />
              <InlineCitationCarouselNext aria-label={labels.next} />
            </InlineCitationCarouselHeader>
            {sources.map((url) => (
              <InlineCitationCarouselItem key={url}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <InlineCitationSource
                    title={sourceTitle(url)}
                    url={url}
                    description={labels.openSourceReference}
                  />
                </a>
              </InlineCitationCarouselItem>
            ))}
          </InlineCitationCarousel>
        </InlineCitationCardBody>
      </InlineCitationCard>
    </InlineCitation>
  )
}
