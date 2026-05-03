import { ACTIVITIES } from "./gameData.js";

const ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS_CUTSCENE = 300;
const MAX_TOKENS_ENDING = 300;

const FALLBACK_CUTSCENE = "Another week at OSU in the books.";
const FALLBACK_ENDING =
  "Your graduation belongs to you alone — a path no ending title could capture.";

/** @param {unknown} internal */
function gpaToFourPoint(internal) {
  const v = Math.min(100, Math.max(0, Number(internal) || 0));
  return (v / 25).toFixed(1);
}

/** @param {unknown} year */
function yearToClassStanding(year) {
  const y = Number(year);
  if (!Number.isFinite(y) || y < 1) return "Freshman";
  if (y === 1) return "Freshman";
  if (y === 2) return "Sophomore";
  if (y === 3) return "Junior";
  return "Senior";
}

/** @param {unknown} entry */
function resolveActivity(entry) {
  if (entry && typeof entry === "object" && "name" in entry && entry.name) {
    return /** @type {{ id?: string; name: string; location: string }} */ (
      entry
    );
  }
  const id =
    typeof entry === "string"
      ? entry
      : entry && typeof entry === "object" && "id" in entry
        ? String(entry.id)
        : "";
  if (!id) return { name: "Unknown activity", location: "" };
  const found = ACTIVITIES.find((a) => a.id === id);
  return found ?? { name: id, location: "" };
}

/** @param {{ id?: string; name: string; location: string }} act */
function activityKey(act) {
  if (act.id) return String(act.id);
  return `${act.name}|${act.location}`;
}

/**
 * @param {unknown[]} chosenActivities activity objects and/or ids
 */
function formatActivityClause(chosenActivities) {
  const raw = Array.isArray(chosenActivities) ? chosenActivities : [];
  const list = raw.map(resolveActivity);
  if (list.length === 0) {
    return "they took no scheduled activities this week";
  }

  /** @type {string[]} */
  const orderedKeys = [];
  /** @type {Map<string, { id?: string; name: string; location: string }>} */
  const keyToActivity = new Map();
  for (const act of list) {
    const key = activityKey(act);
    if (!keyToActivity.has(key)) {
      orderedKeys.push(key);
      keyToActivity.set(key, act);
    }
  }

  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const act of list) {
    const key = activityKey(act);
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  function repeatPhrase(n) {
    if (n === 2) return "twice";
    if (n === 3) return "three times";
    return `${n} times`;
  }

  const parts = orderedKeys.map((key) => {
    const act = keyToActivity.get(key);
    const count = counts.get(key) || 1;
    const name = act?.name || "Activity";
    const loc = act?.location || "";
    const label = loc ? `${name} (${loc})` : name;
    if (count > 1) {
      return `${label} — ${repeatPhrase(count)}`;
    }
    return label;
  });

  return parts.join("; ");
}

/**
 * @param {unknown} data
 * @returns {string | null}
 */
function extractTextFromAnthropicResponse(data) {
  if (!data || typeof data !== "object") return null;
  const content = data.content;
  if (!Array.isArray(content)) return null;
  const textBlock = content.find((b) => b && typeof b === "object" && b.type === "text");
  if (!textBlock || typeof textBlock.text !== "string") return null;
  const t = textBlock.text.trim();
  return t.length > 0 ? t : null;
}

/**
 * @param {string} userPrompt
 * @param {number} maxTokens
 */
async function callAnthropicMessages(userPrompt, maxTokens) {
  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
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

  const text = extractTextFromAnthropicResponse(data);
  if (!text) throw new Error("No text content in response");
  return text;
}

/**
 * @param {string} playerName
 * @param {number} year
 * @param {number} week
 * @param {unknown[]} chosenActivities
 * @param {{ gpa?: number; health?: number; happiness?: number; social?: number }} currentStats
 * @param {{ gpa?: number; health?: number; happiness?: number; social?: number }} week1BaselineStats
 * @returns {string}
 */
export function buildCutsceneUserPrompt(
  playerName,
  year,
  week,
  chosenActivities,
  currentStats,
  week1BaselineStats,
) {
  const standing = yearToClassStanding(year);
  const activityText = formatActivityClause(chosenActivities);
  const gpaNow = gpaToFourPoint(currentStats?.gpa);
  const hNow = Number(currentStats?.health) || 0;
  const hapNow = Number(currentStats?.happiness) || 0;
  const sNow = Number(currentStats?.social) || 0;

  const gpaBase = gpaToFourPoint(week1BaselineStats?.gpa);
  const hBase = Number(week1BaselineStats?.health) || 0;
  const hapBase = Number(week1BaselineStats?.happiness) || 0;
  const sBase = Number(week1BaselineStats?.social) || 0;

  return `The player's name is ${playerName}. They are a ${standing} at Oregon State University in Week ${week} of their college journey. This week they: ${activityText}. Their current stats: GPA ${gpaNow}, Health ${hNow}/100, Happiness ${hapNow}/100, Social ${sNow}/100. When they arrived at OSU in Week 1, their baseline stats were: GPA ${gpaBase}, Health ${hBase}/100, Happiness ${hapBase}/100, Social ${sBase}/100. Write a short vivid 3-4 sentence story about their week. Reference real OSU and Corvallis locations by name. Reflect how they have grown or changed since Week 1. Match tone to their current stats — upbeat if stats are high, gritty if declining. No emojis.`;
}

/**
 * Prompt for the weekly choice scenario JSON (server route). Include a uniqueness hint so
 * different players and playthroughs do not collapse to the same dilemmas.
 *
 * @param {string} playerName
 * @param {number} year
 * @param {number} week
 * @param {unknown[]} chosenActivities
 * @param {string} uniquenessHint
 */
export function buildWeeklyScenarioJsonPrompt(
  playerName,
  year,
  week,
  chosenActivities,
  uniquenessHint,
) {
  const standing = yearToClassStanding(year);
  const activityText = formatActivityClause(chosenActivities);
  return (
    `Invent one fresh college-life dilemma for "${playerName}", a ${standing} at Oregon State University (Year ${year}, Week ${week}). ` +
    `This week they: ${activityText}. ` +
    `Make it specific to OSU / Corvallis, funny but grounded, and not a generic "study vs party" clone unless the situation truly calls for it. ` +
    `Use this inspiration seed to steer a unique angle (do not quote the seed verbatim): ${uniquenessHint}\n\n` +
    `Respond with only valid JSON, no markdown fences, in exactly this shape: ` +
    `{ "title": string, "description": string, "choices": [` +
    `{ "label": string, "consequence": { "gpa"?: number, "health"?: number, "happiness"?: number, "social"?: number, "message": string } }, ` +
    `{ "label": string, "consequence": { ... } } ] }. ` +
    `Use two choices. Consequence stat deltas should be small integers (about -15 to 15). ` +
    `Each consequence "message" is a reveal shown only after the player chooses. No sexual content.`
  );
}

/**
 * @param {string} playerName
 * @param {number} year
 * @param {number} week
 * @param {unknown[]} chosenActivities
 * @param {{ gpa?: number; health?: number; happiness?: number; social?: number }} currentStats
 * @param {{ gpa?: number; health?: number; happiness?: number; social?: number }} week1BaselineStats
 * @returns {Promise<string>}
 */
export async function generateCutscene(
  playerName,
  year,
  week,
  chosenActivities,
  currentStats,
  week1BaselineStats,
) {
  try {
    const userPrompt = buildCutsceneUserPrompt(
      playerName,
      year,
      week,
      chosenActivities,
      currentStats,
      week1BaselineStats,
    );
    return await callAnthropicMessages(userPrompt, MAX_TOKENS_CUTSCENE);
  } catch {
    return FALLBACK_CUTSCENE;
  }
}

/**
 * @param {string} playerName
 * @param {{ gpa?: number; health?: number; happiness?: number; social?: number }} finalStats
 * @returns {Promise<string>}
 */
export async function generateCustomEnding(playerName, finalStats) {
  try {
    const gpa = gpaToFourPoint(finalStats?.gpa);
    const health = Number(finalStats?.health) || 0;
    const happiness = Number(finalStats?.happiness) || 0;
    const social = Number(finalStats?.social) || 0;

    const userPrompt =
      `Write a 3-sentence graduation reflection for ${playerName} at Oregon State University. Their final stats: GPA ${gpa}, Health ${health}/100, Happiness ${happiness}/100, Social ${social}/100. Write a tone-appropriate custom ending that reflects this specific stat combination.`;

    return await callAnthropicMessages(userPrompt, MAX_TOKENS_ENDING);
  } catch {
    return FALLBACK_ENDING;
  }
}
