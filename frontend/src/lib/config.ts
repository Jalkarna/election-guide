export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window === "undefined" ? "" : window.location.origin)

export const BACKEND_WS_URL = BACKEND_URL.replace(/^http/, "ws")
