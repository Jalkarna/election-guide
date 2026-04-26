const configuredBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim()

export const BACKEND_URL =
  configuredBackendUrl ||
  (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8001" : "")
