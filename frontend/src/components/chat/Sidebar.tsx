"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react"
import type { Session } from "@/lib/api"
import type { UiCopyKey } from "@/lib/i18n"
import { stripMarkdown } from "@/lib/markdown"
import { cn } from "@/lib/utils"
import { ChakraIcon } from "@/components/chat/ChakraIcon"

export function Sidebar({
  sessions, currentId, onSelect, onNew, onDelete, onClearAll, mobileOpen, onMobileClose, t,
}: {
  sessions: Session[]
  currentId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onClearAll: () => void
  mobileOpen: boolean
  onMobileClose: () => void
  t: (key: UiCopyKey) => string
}) {
  const [collapsed, setCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false
    try {
      return localStorage.getItem("sidebar-collapsed") === "true"
    } catch {
      return false
    }
  })

  const toggleCollapse = () => {
    setCollapsed(v => {
      try {
        localStorage.setItem("sidebar-collapsed", String(!v))
      } catch (error) {
        console.warn("Failed to persist sidebar state", error)
      }
      return !v
    })
  }

  const fade = {
    initial:    { opacity: 0, width: 0 },
    animate:    { opacity: 1, width: "auto" as const },
    exit:       { opacity: 0, width: 0 },
    transition: { duration: 0.2, ease: "easeInOut" as const },
  }

  const handleNew = () => {
    onNew()
    onMobileClose()
  }
  const effectiveCollapsed = collapsed && !mobileOpen

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-sidebar-border bg-sidebar overflow-hidden",
        "transition-[width,transform] duration-300 ease-in-out",
        "lg:relative",
        effectiveCollapsed ? "w-[52px]" : "w-[240px]",
        mobileOpen ? "translate-x-0 !w-[min(86vw,320px)]" : "-translate-x-full lg:translate-x-0",
      )}>

        {/* Header — always one horizontal row */}
        <div className="flex h-[calc(52px+env(safe-area-inset-top))] shrink-0 items-center border-b border-sidebar-border px-3 pt-[env(safe-area-inset-top)] lg:h-[52px] lg:pt-0">

          {/* Brand — hidden when collapsed */}
          <AnimatePresence initial={false}>
            {!effectiveCollapsed && (
              <motion.button
                {...fade}
                type="button"
                onClick={handleNew}
                title={t("newConversation")}
                className="flex min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded-lg p-1 text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--saffron)]/15 ring-1 ring-[color:var(--saffron)]/20">
                  <ChakraIcon className="h-4 w-4 text-[color:var(--saffron)]" />
                </div>
                <span className="whitespace-nowrap font-display text-sm font-bold tracking-tight text-sidebar-foreground">
                  {t("appName")}
                </span>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Collapse toggle — always visible on desktop */}
          <button
            type="button"
            onClick={toggleCollapse}
            title={effectiveCollapsed ? t("expandSidebar") : t("collapseSidebar")}
            className="ml-auto hidden shrink-0 cursor-pointer rounded-lg p-1.5 text-sidebar-foreground/35 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
          >
            {effectiveCollapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronLeft className="h-4 w-4" />
            }
          </button>
          <button
            type="button"
            onClick={onMobileClose}
            title={t("closeSidebar")}
            aria-label={t("closeSidebar")}
            className="ml-auto flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* New conversation */}
        <div className="shrink-0 px-2 pt-2 pb-1">
          <button
            type="button"
            onClick={handleNew}
            title={t("newConversation")}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Plus className="h-3.5 w-3.5 shrink-0" />
            <AnimatePresence initial={false}>
              {!effectiveCollapsed && (
                <motion.span {...fade} className="overflow-hidden whitespace-nowrap">
                  {t("newConversation")}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          {sessions.length > 0 && !effectiveCollapsed && (
            <button
              type="button"
              onClick={onClearAll}
              title={t("clearConversations")}
              aria-label={t("clearConversations")}
              className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span className="overflow-hidden whitespace-nowrap">{t("clearConversations")}</span>
            </button>
          )}
        </div>

        {/* Session list — always rendered, hidden by overflow-hidden + width */}
        <div className={cn("flex-1 overflow-y-auto px-2 py-1", effectiveCollapsed && "hidden")}>
          {sessions.length === 0 && !effectiveCollapsed && (
            <p className="px-3 py-8 text-center text-xs text-sidebar-foreground/55">
              {t("noConversations")}
            </p>
          )}
          {/* mode="popLayout" for smooth add/remove without layout jumps */}
          <AnimatePresence mode="popLayout" initial={false}>
            {!effectiveCollapsed && sessions.map(s => {
              return (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
                className={cn(
                  "group relative flex min-h-11 cursor-pointer items-center rounded-lg py-2 pl-3 pr-11 transition-colors lg:min-h-0 lg:pr-3 lg:group-hover:pr-9",
                  currentId === s.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
                title={stripMarkdown(s.title || t("newConversation"))}
                onClick={() => onSelect(s.id)}
              >
                {currentId === s.id && (
                  <div className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[color:var(--saffron)]" />
                )}
                <div className="flex min-w-0 flex-1 items-center">
                  <span className="truncate text-left text-xs">
                    {stripMarkdown(s.title || t("newConversation"))}
                  </span>
                </div>
                <button
                  type="button"
                  title={t("deleteConversation")}
                  aria-label={t("deleteConversation")}
                  onClick={e => { e.stopPropagation(); onDelete(s.id) }}
                  className="absolute right-2 hidden h-8 w-8 cursor-pointer shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/45 transition-colors hover:text-destructive max-lg:flex lg:h-5 lg:w-5 lg:rounded lg:text-sidebar-foreground/25 lg:group-hover:flex"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </motion.div>
            )})}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className={cn("flex shrink-0 items-center border-t border-sidebar-border px-3 py-3", effectiveCollapsed && "hidden")}>
          <AnimatePresence initial={false}>
            {!effectiveCollapsed && (
              <motion.span
                {...fade}
                className="w-full overflow-hidden whitespace-nowrap text-center text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/65"
              >
                {t("appName")}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </aside>
    </>
  )
}

