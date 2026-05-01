import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const platformClientSource = readFileSync(new URL("../src/lib/platform.ts", import.meta.url), "utf8")

test("platform client exposes feature, readiness, and quiz APIs", () => {
  assert.match(platformClientSource, /listPlatformFeatures/)
  assert.match(platformClientSource, /scoreReadiness/)
  assert.match(platformClientSource, /loadQuiz/)
})

test("platform client targets backend platform routes", () => {
  assert.match(platformClientSource, /\/api\/platform\/features/)
  assert.match(platformClientSource, /\/api\/platform\/readiness/)
  assert.match(platformClientSource, /\/api\/platform\/quiz/)
})
