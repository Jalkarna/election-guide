import assert from "node:assert/strict"
import test from "node:test"

import { sanitizeAssistantContent, stripMarkdown } from "../src/lib/markdown.ts"

test("sanitizes malformed model category bullets", () => {
  const raw = [
    "Hello! I amElectionGuide.",
    "",
    "***Voter Services:**How to register. ***Election Types:**Understanding Lok Sabha.",
    "",
    "- - -",
  ].join("\n")

  assert.equal(
    sanitizeAssistantContent(raw),
    [
      "Hello! I am ElectionGuide.",
      "",
      "- **Voter Services:** How to register.",
      "- **Election Types:** Understanding Lok Sabha.",
    ].join("\n"),
  )
})

test("strips markdown for sidebar labels", () => {
  assert.equal(stripMarkdown("**Voter Services:** `Form 6`"), "Voter Services: Form 6")
})
