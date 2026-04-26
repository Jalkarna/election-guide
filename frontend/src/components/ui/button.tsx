import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline" | "destructive" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
        {
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm": variant === "default",
          "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          "border border-border bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
          "bg-destructive text-white hover:bg-destructive/90": variant === "destructive",
          "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
        },
        {
          "h-9 px-4 py-2": size === "default",
          "h-8 px-3 text-xs": size === "sm",
          "h-10 px-6": size === "lg",
          "size-9 p-0": size === "icon",
        },
        className
      )}
      {...props}
    />
  )
)
Button.displayName = "Button"
