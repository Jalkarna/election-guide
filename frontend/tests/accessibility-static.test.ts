import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const pageSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8")
const citationSource = readFileSync(new URL("../src/components/SourceCitations.tsx", import.meta.url), "utf8")

test("icon-only controls expose accessible names", () => {
  assert.match(pageSource, /aria-label=\{t\("sendMessage"\)\}/)
  assert.match(pageSource, /aria-label=\{t\("stopResponse"\)\}/)
  assert.match(pageSource, /aria-label=\{t\("expandSidebar"\)\}/)
  assert.match(pageSource, /aria-label=\{t\("newConversation"\)\}/)
  assert.match(pageSource, /aria-label=\{t\("deleteConversation"\)\}/)
})

test("interactive disabled states are represented in the UI", () => {
  assert.match(pageSource, /disabled=\{disabled\}/)
  assert.match(pageSource, /disabled=\{!canSubmit\}/)
  assert.match(pageSource, /disabled:pointer-events-none/)
})

test("source links preserve chat context and protect opener", () => {
  assert.match(citationSource, /target="_blank"/)
  assert.match(citationSource, /rel="noopener noreferrer"/)
})
