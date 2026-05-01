export function sanitizeAssistantContent(content: string) {
  let next = content.replace(/\r\n/g, "\n")
  next = next.replace(/\s*\[Source:[^\]]+\]/g, "")
  // Fix common model markdown glitches before handing content to ReactMarkdown.
  next = next.replace(/\b(I am|I'm|This is)(ElectionGuide)\b/g, "$1 ElectionGuide")
  next = next.replace(/(^|[\n \t])\*{3}[ \t]*([^*\n:]{1,72}):\*\*[ \t]*/gu, (_match, prefix, label) => {
    return `${prefix && prefix.includes("\n") ? prefix : "\n"}- **${String(label).trim()}:** `
  })
  next = next.replace(/\*\*[ \t]+(?=\S)/g, "**")
  next = next.replace(/\*\*([^*\n]*?\S)[ \t]+\*\*/g, "**$1**")
  next = next.replace(/(^|\n)([ \t]*(?:(?:[-*+]|\d+[.)])\s+)?)([^*\n:]{1,64}):\*\*(?=\s)/gu, (_match, lineStart, prefix, label) => {
    return `${lineStart}${prefix}**${String(label).trim()}:**`
  })
  next = next.replace(/(\*\*[^*\n]{1,80}:\*\*)(?=\S)/gu, "$1 ")
  next = next.replace(/(^|\n)[ \t]*(?:[-*_][ \t]*){3,}(?=\n|$)/g, "$1\n")
  // Fix deserialization artifacts: space before punctuation.
  next = next.replace(/\s+([,;:.!?])/g, "$1")
  next = next.replace(/\n{3,}/g, "\n\n")
  return next.trim()
}

export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/#+\s*/g, "")
    .trim()
}
