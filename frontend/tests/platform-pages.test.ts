import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const routes = [
  "../src/app/page.tsx",
  "../src/app/assistant/page.tsx",
  "../src/app/platform/page.tsx",
  "../src/app/readiness/page.tsx",
  "../src/app/journey/page.tsx",
  "../src/app/booth/page.tsx",
  "../src/app/quiz/page.tsx",
  "../src/app/scenarios/page.tsx",
  "../src/app/resources/page.tsx",
  "../src/app/architecture/page.tsx",
  "../src/app/login/page.tsx",
  "../src/app/signup/page.tsx",
]

test("platform exposes a broad route surface", () => {
  const sources = routes.map(route => readFileSync(new URL(route, import.meta.url), "utf8"))

  assert.equal(sources.length, 12)
  assert.match(sources.join("\n"), /Google Cloud/)
  assert.match(sources.join("\n"), /Booth preparation/)
  assert.match(sources.join("\n"), /AuthPanel/)
})

test("external official resources preserve user context", () => {
  const resources = readFileSync(new URL("../src/app/resources/page.tsx", import.meta.url), "utf8")

  assert.match(resources, /target="_blank"/)
  assert.match(resources, /rel="noopener noreferrer"/)
})
