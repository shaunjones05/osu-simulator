/**
 * Pull assistant-visible text from a Claude Messages API JSON body.
 * Joins every `type: "text"` block (some responses use multiple blocks).
 * @param {unknown} data
 * @returns {string | null}
 */
export function extractAssistantText(data) {
  if (!data || typeof data !== "object") return null;
  const content = /** @type {{ content?: unknown }} */ (data).content;
  if (!Array.isArray(content)) return null;
  /** @type {string[]} */
  const parts = [];
  for (const b of content) {
    if (
      b &&
      typeof b === "object" &&
      "type" in b &&
      b.type === "text" &&
      "text" in b &&
      typeof b.text === "string"
    ) {
      const t = b.text.trim();
      if (t) parts.push(t);
    }
  }
  if (!parts.length) return null;
  return parts.join("\n\n");
}
