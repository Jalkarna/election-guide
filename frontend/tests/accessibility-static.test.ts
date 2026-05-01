import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const pageSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8")
const chatExperienceSource = readFileSync(new URL("../src/components/chat/ChatExperience.tsx", import.meta.url), "utf8")
const composerSource = readFileSync(new URL("../src/components/chat/Composer.tsx", import.meta.url), "utf8")
const greetingSource = readFileSync(new URL("../src/components/chat/Greeting.tsx", import.meta.url), "utf8")
const sidebarSource = readFileSync(new URL("../src/components/chat/Sidebar.tsx", import.meta.url), "utf8")
const citationSource = readFileSync(new URL("../src/components/SourceCitations.tsx", import.meta.url), "utf8")
const chatUiSource = [chatExperienceSource, composerSource, greetingSource, sidebarSource].join("\n")

test("default route is a landing page with assistant and auth entry points", () => {
  assert.match(pageSource, /ElectionGuide/)
  assert.match(pageSource, /href="\/assistant"/)
  assert.match(pageSource, /href="\/signup"/)
})

test("icon-only controls expose accessible names", () => {
  assert.match(chatUiSource, /aria-label=\{t\("sendMessage"\)\}/)
  assert.match(chatUiSource, /aria-label=\{t\("stopResponse"\)\}/)
  assert.match(chatUiSource, /aria-label=\{t\("expandSidebar"\)\}/)
  assert.match(chatUiSource, /aria-label=\{t\("newConversation"\)\}/)
  assert.match(chatUiSource, /aria-label=\{t\("deleteConversation"\)\}/)
})

test("interactive disabled states are represented in the UI", () => {
  assert.match(chatUiSource, /disabled=\{disabled\}/)
  assert.match(chatUiSource, /disabled=\{!canSubmit\}/)
  assert.match(chatUiSource, /disabled:pointer-events-none/)
})

test("source links preserve chat context and protect opener", () => {
  assert.match(citationSource, /target="_blank"/)
  assert.match(citationSource, /rel="noopener noreferrer"/)
})
