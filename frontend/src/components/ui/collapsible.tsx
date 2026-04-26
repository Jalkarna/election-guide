"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  className?: string
}

export function Collapsible({ open, onOpenChange, children, className }: CollapsibleProps) {
  const [internalOpen, setInternalOpen] = React.useState(open ?? false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const toggle = () => {
    if (isControlled) {
      onOpenChange?.(!open)
    } else {
      setInternalOpen((v) => !v)
    }
  }

  return (
    <div className={cn("", className)} data-state={isOpen ? "open" : "closed"}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ isOpen?: boolean; onToggle?: () => void }>, { isOpen, onToggle: toggle })
        }
        return child
      })}
    </div>
  )
}

interface CollapsibleTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen?: boolean
  onToggle?: () => void
  children: React.ReactNode
}

export function CollapsibleTrigger({ isOpen, onToggle, children, className, ...props }: CollapsibleTriggerProps) {
  return (
    <button
      onClick={onToggle}
      className={cn("flex w-full items-center gap-2 text-left", className)}
      aria-expanded={isOpen}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn("ml-auto h-4 w-4 transition-transform duration-200 shrink-0", isOpen && "rotate-180")}
      />
    </button>
  )
}

interface CollapsibleContentProps {
  isOpen?: boolean
  children: React.ReactNode
  className?: string
}

export function CollapsibleContent({ isOpen, children, className }: CollapsibleContentProps) {
  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-300",
        isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        className
      )}
    >
      {children}
    </div>
  )
}
