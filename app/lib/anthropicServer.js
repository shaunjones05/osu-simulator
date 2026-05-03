import { extractAssistantText } from "./anthropicResponseText.js";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";

/**
 * @param {string} userPrompt
 * @param {number} maxTokens
 * @param {string} [model]
 */
export async function anthropicMessagesComplete(
  userPrompt,
  maxTokens,
  model = "claude-sonnet-4-5",
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === "your-key-here") {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const msg =
      data && typeof data === "object" && data.error && data.error.message
        ? String(data.error.message)
        : `HTTP ${response.status}`;
    throw new Error(msg);
  }

  const text = extractAssistantText(data);
  if (!text) throw new Error("No text content in response");
  return text;
}
