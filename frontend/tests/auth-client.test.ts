import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const authClientSource = readFileSync(new URL("../src/lib/auth.ts", import.meta.url), "utf8")
const authPanelSource = readFileSync(new URL("../src/components/auth/AuthPanel.tsx", import.meta.url), "utf8")

test("auth client targets provider discovery and Google session routes", () => {
  assert.match(authClientSource, /\/api\/auth\/providers/)
  assert.match(authClientSource, /\/api\/auth\/google\/dev/)
})

test("auth panel exposes Google sign-in state and local token persistence", () => {
  assert.match(authPanelSource, /Continue with Google/)
  assert.match(authPanelSource, /eg-auth-token/)
  assert.match(authPanelSource, /authorization_url/)
})
