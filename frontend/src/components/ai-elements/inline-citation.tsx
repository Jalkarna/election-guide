"use client"

import * as React from "react"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CitationCardContextValue {
  isOpen: boolean
  open: () => void
  closeSoon: () => void
}

const CitationCardContext = React.createContext<CitationCardContextValue | null>(null)

function useCitationCard() {
  return React.useContext(CitationCardContext)
}

export type InlineCitationProps = React.ComponentProps<"div">

export function InlineCitation({ className, ...props }: InlineCitationProps) {
  return (
    <div
      className={cn("group/inline-citation relative flex items-center", className)}
      {...props}
    />
  )
}

export type InlineCitationTextProps = React.ComponentProps<"span">

export function InlineCitationText({ className, ...props }: InlineCitationTextProps) {
  return (
    <span
      className={cn("transition-colors group-hover/inline-citation:bg-accent", className)}
      {...props}
    />
  )
}

export type InlineCitationCardProps = React.ComponentProps<"div">

export function InlineCitationCard({ className, onMouseEnter, onMouseLeave, onFocus, onBlur, ...props }: InlineCitationCardProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const closeTimer = React.useRef<number | null>(null)

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const open = React.useCallback(() => {
    clearCloseTimer()
    setIsOpen(true)
  }, [clearCloseTimer])

  const closeSoon = React.useCallback(() => {
    clearCloseTimer()
    closeTimer.current = window.setTimeout(() => setIsOpen(false), 180)
  }, [clearCloseTimer])

  React.useEffect(() => () => clearCloseTimer(), [clearCloseTimer])

  const value = React.useMemo(() => ({ isOpen, open, closeSoon }), [isOpen, open, closeSoon])

  return (
    <CitationCardContext.Provider value={value}>
      <div
        className={cn("relative inline-flex items-center", className)}
        onBlur={(event) => {
          onBlur?.(event)
          closeSoon()
        }}
        onFocus={(event) => {
          onFocus?.(event)
          open()
        }}
        onMouseEnter={(event) => {
          onMouseEnter?.(event)
          open()
        }}
        onMouseLeave={(event) => {
          onMouseLeave?.(event)
          closeSoon()
        }}
        {...props}
      />
    </CitationCardContext.Provider>
  )
}

export type InlineCitationCardTriggerProps = React.ComponentProps<typeof Badge> & {
  sources: string[]
  ariaLabel?: string
}

function hostname(url?: string) {
  if (!url) return "unknown"
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] || "unknown"
  }
}

export function InlineCitationCardTrigger({
  sources,
  className,
  ariaLabel,
  ...props
}: InlineCitationCardTriggerProps) {
  const href = sources[0]

  return (
    <a
      aria-label={ariaLabel ?? (href ? `Open source ${hostname(href)}` : "Open source")}
      className="inline-flex"
      href={href || undefined}
      rel="noopener noreferrer"
      target="_blank"
    >
      <Badge
        className={cn(
          "cursor-pointer rounded-md border border-border/70 bg-secondary/70 px-2 py-0.5 text-[11px] font-normal text-secondary-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground",
          className,
        )}
        variant="secondary"
        {...props}
      >
        {hostname(href)}
        {sources.length > 1 && ` +${sources.length - 1}`}
      </Badge>
    </a>
  )
}

export type InlineCitationCardBodyProps = React.ComponentProps<"div">

export function InlineCitationCardBody({ className, ...props }: InlineCitationCardBodyProps) {
  const card = useCitationCard()

  return (
    <div
      className={cn(
        "pointer-events-auto absolute bottom-full left-0 z-50 w-[min(20rem,calc(100vw-2rem))] rounded-md border border-border bg-card text-card-foreground shadow-[var(--shadow-float)]",
        card?.isOpen ? "block" : "hidden",
        className,
      )}
      {...props}
    />
  )
}

interface CarouselContextValue {
  current: number
  count: number
  next: () => void
  prev: () => void
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null)

function useCarousel() {
  return React.useContext(CarouselContext)
}

export type InlineCitationCarouselProps = React.ComponentProps<"div">

export function InlineCitationCarousel({
  className,
  children,
  ...props
}: InlineCitationCarouselProps) {
  const childrenArray = React.Children.toArray(children)
  const [header, ...items] = childrenArray
  const [current, setCurrent] = React.useState(0)
  const count = items.length
  const value = React.useMemo(
    () => ({
      current,
      count,
      next: () => setCurrent((index) => Math.min(index + 1, Math.max(count - 1, 0))),
      prev: () => setCurrent((index) => Math.max(index - 1, 0)),
    }),
    [count, current],
  )

  return (
    <CarouselContext.Provider value={value}>
      <div className={cn("block w-full", className)} {...props}>
        {header}
        {items[current]}
      </div>
    </CarouselContext.Provider>
  )
}

export type InlineCitationCarouselContentProps = React.ComponentProps<"div">

export function InlineCitationCarouselContent({
  className,
  ...props
}: InlineCitationCarouselContentProps) {
  return <div className={cn("block", className)} {...props} />
}

export type InlineCitationCarouselItemProps = React.ComponentProps<"div">

export function InlineCitationCarouselItem({
  className,
  ...props
}: InlineCitationCarouselItemProps) {
  return <div className={cn("block w-full p-4", className)} {...props} />
}

export type InlineCitationCarouselHeaderProps = React.ComponentProps<"div">

export function InlineCitationCarouselHeader({
  className,
  ...props
}: InlineCitationCarouselHeaderProps) {
  return (
    <div
      className={cn("flex items-center justify-between gap-2 border-b border-border bg-secondary px-2 py-1.5", className)}
      {...props}
    />
  )
}

export type InlineCitationCarouselIndexProps = React.ComponentProps<"div">

export function InlineCitationCarouselIndex({
  children,
  className,
  ...props
}: InlineCitationCarouselIndexProps) {
  const api = useCarousel()
  return (
    <div
      className={cn("flex flex-1 items-center justify-end px-2 py-1 text-xs text-muted-foreground", className)}
      {...props}
    >
      {children ?? `${(api?.current ?? 0) + 1}/${api?.count ?? 0}`}
    </div>
  )
}

export type InlineCitationCarouselPrevProps = React.ComponentProps<"button">

export function InlineCitationCarouselPrev({
  className,
  ...props
}: InlineCitationCarouselPrevProps) {
  const api = useCarousel()
  return (
    <button
      aria-label="Previous"
      className={cn("shrink-0 rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30", className)}
      disabled={!api || api.current === 0}
      onClick={(event) => {
        event.preventDefault()
        api?.prev()
      }}
      type="button"
      {...props}
    >
      <ArrowLeftIcon className="size-4" />
    </button>
  )
}

export type InlineCitationCarouselNextProps = React.ComponentProps<"button">

export function InlineCitationCarouselNext({
  className,
  ...props
}: InlineCitationCarouselNextProps) {
  const api = useCarousel()
  return (
    <button
      aria-label="Next"
      className={cn("shrink-0 rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30", className)}
      disabled={!api || api.current >= api.count - 1}
      onClick={(event) => {
        event.preventDefault()
        api?.next()
      }}
      type="button"
      {...props}
    >
      <ArrowRightIcon className="size-4" />
    </button>
  )
}

export type InlineCitationSourceProps = React.ComponentProps<"div"> & {
  title?: string
  url?: string
  description?: string
}

export function InlineCitationSource({
  title,
  url,
  description,
  className,
  children,
  ...props
}: InlineCitationSourceProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      {title && <h4 className="truncate text-sm font-medium leading-tight">{title}</h4>}
      {url && <p className="truncate break-all text-xs text-muted-foreground">{url}</p>}
      {description && (
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {children}
    </div>
  )
}

export type InlineCitationQuoteProps = React.ComponentProps<"blockquote">

export function InlineCitationQuote({
  children,
  className,
  ...props
}: InlineCitationQuoteProps) {
  return (
    <blockquote
      className={cn("border-l-2 border-muted pl-3 text-sm italic text-muted-foreground", className)}
      {...props}
    >
      {children}
    </blockquote>
  )
}
