"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronRightIcon, DotIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ChainOfThoughtContextValue {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const ChainOfThoughtContext = React.createContext<ChainOfThoughtContextValue | null>(null)

function useChainOfThought() {
  const context = React.useContext(ChainOfThoughtContext)
  if (!context) {
    throw new Error("ChainOfThought components must be used within ChainOfThought")
  }
  return context
}

export type ChainOfThoughtProps = React.ComponentProps<"div"> & {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export const ChainOfThought = React.memo(function ChainOfThought({
  className,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: ChainOfThoughtProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const setIsOpen = React.useCallback((nextOpen: boolean) => {
    if (!isControlled) setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }, [isControlled, onOpenChange])

  const value = React.useMemo(() => ({ isOpen, setIsOpen }), [isOpen, setIsOpen])

  return (
    <ChainOfThoughtContext.Provider value={value}>
      <div className={cn("not-prose w-full space-y-3", className)} {...props}>
        {children}
      </div>
    </ChainOfThoughtContext.Provider>
  )
})

export type ChainOfThoughtHeaderProps =
  React.ComponentProps<"button">

export const ChainOfThoughtHeader = React.memo(function ChainOfThoughtHeader({
  className,
  children,
  ...props
}: ChainOfThoughtHeaderProps) {
  const { isOpen, setIsOpen } = useChainOfThought()

  return (
    <button
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "group flex w-fit cursor-pointer items-center gap-1.5 rounded-md py-1 pr-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
      {...props}
    >
      <span className="text-left">
        {children ?? "Reasoning"}
      </span>
      <ChevronRightIcon className={cn("h-3 w-3 shrink-0 transition-transform duration-200", isOpen && "rotate-90")} />
    </button>
  )
})

export type ChainOfThoughtStepProps = React.ComponentProps<"div"> & {
  icon?: LucideIcon
  label: React.ReactNode
  description?: React.ReactNode
  status?: "complete" | "active" | "pending"
  showConnector?: boolean
}

const stepStatusStyles = {
  active: "text-foreground",
  complete: "text-muted-foreground",
  pending: "text-muted-foreground/50",
}

export const ChainOfThoughtStep = React.memo(function ChainOfThoughtStep({
  className,
  icon: Icon = DotIcon,
  label,
  description,
  status = "complete",
  showConnector = true,
  children,
  ...props
}: ChainOfThoughtStepProps) {
  return (
    <div
      className={cn(
        "chain-step flex gap-2 text-xs",
        stepStatusStyles[status],
        "fade-in-0 slide-in-from-top-2 animate-in",
        className,
      )}
      {...props}
    >
      <div className="relative mt-0.5 shrink-0">
        <Icon className="size-3.5" />
        {showConnector && (
          <div className="chain-step-line absolute top-6 bottom-0 left-1/2 -mx-px w-px bg-border" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2 overflow-hidden">
        <div className="leading-relaxed">
          {label}
        </div>
        {description && (
          <div className="text-xs leading-relaxed text-muted-foreground/70">
            {description}
          </div>
        )}
        {children}
      </div>
    </div>
  )
})

export type ChainOfThoughtSearchResultsProps = React.ComponentProps<"div">

export const ChainOfThoughtSearchResults = React.memo(function ChainOfThoughtSearchResults({
  className,
  ...props
}: ChainOfThoughtSearchResultsProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      {...props}
    />
  )
})

export type ChainOfThoughtSearchResultProps = React.ComponentProps<typeof Badge>

export const ChainOfThoughtSearchResult = React.memo(function ChainOfThoughtSearchResult({
  className,
  children,
  ...props
}: ChainOfThoughtSearchResultProps) {
  return (
    <Badge
      className={cn("gap-1 px-2 py-0.5 text-[10px] font-normal", className)}
      variant="secondary"
      {...props}
    >
      {children}
    </Badge>
  )
})

export type ChainOfThoughtContentProps = React.ComponentProps<"div">

export const ChainOfThoughtContent = React.memo(function ChainOfThoughtContent({
  className,
  children,
  ...props
}: ChainOfThoughtContentProps) {
  const { isOpen } = useChainOfThought()
  if (!isOpen) return null

  return (
    <div
      className={cn("mt-2 space-y-3", className)}
      {...props}
    >
      {children}
    </div>
  )
})

export type ChainOfThoughtImageProps = React.ComponentProps<"div"> & {
  caption?: string
}

export const ChainOfThoughtImage = React.memo(function ChainOfThoughtImage({
  className,
  children,
  caption,
  ...props
}: ChainOfThoughtImageProps) {
  return (
    <div className={cn("mt-2 space-y-2", className)} {...props}>
      <div className="relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-lg bg-muted p-3">
        {children}
      </div>
      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
    </div>
  )
})
