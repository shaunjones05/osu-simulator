import { ACTIVITIES_FOR_SIM } from "./gameData.js";
import { extractAssistantText } from "./anthropicResponseText.js";

const ANTHROPIC_MESSAGES_URL = "/api/claude";
/** Keep in sync with `anthropicMessagesComplete` default in `anthropicServer.js`. */
const MODEL = "claude-sonnet-4-5";
/** Weekly vignette: keep low so the model finishes fast and stays terse. */
export const MAX_TOKENS_CUTSCENE = 100;
const MAX_TOKENS_ENDING = 300;

export const FALLBACK_CUTSCENE = "Another week at OSU in the books.";
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
  const found = ACTIVITIES_FOR_SIM.find((a) => a.id === id);
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
 * @param {string} userPrompt
 * @param {number} maxTokens
 */
async function callAnthropicMessages(userPrompt, maxTokens) {
  const response = await fetch(ANTHROPIC_MESSAGES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

  const text = extractAssistantText(data);
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
 * @param {number} moneyDollars cash on hand this week (after resolutions)
 * @param {string} jobLine human-readable job summary (e.g. job name + weekly pay) or "no part-time job"
 * @param {string} [playerMajor] declared major for narrative flavor
 * @returns {string}
 */
export function buildCutsceneUserPrompt(
  playerName,
  year,
  week,
  chosenActivities,
  currentStats,
  week1BaselineStats,
  moneyDollars,
  jobLine,
  playerMajor = "",
) {
  const standing = yearToClassStanding(year);
  const activityText = formatActivityClause(chosenActivities);
  const gpaNow = gpaToFourPoint(currentStats?.gpa);
  const hNow = Number(currentStats?.health) || 0;
  const hapNow = Number(currentStats?.happiness) || 0;
  const sNow = Number(currentStats?.social) || 0;
  const looksNow = Number(currentStats?.attractiveness) || 0;

  const gpaBase = gpaToFourPoint(week1BaselineStats?.gpa);
  const hBase = Number(week1BaselineStats?.health) || 0;
  const hapBase = Number(week1BaselineStats?.happiness) || 0;
  const sBase = Number(week1BaselineStats?.social) || 0;
  const looksBase = Number(week1BaselineStats?.attractiveness) || 0;

  const money = Math.max(0, Math.round(Number(moneyDollars) || 0));
  const job = typeof jobLine === "string" && jobLine.trim() ? jobLine.trim() : "no part-time job";
  const majorTrim =
    typeof playerMajor === "string" && playerMajor.trim()
      ? playerMajor.trim()
      : "";
  const majorBit = majorTrim ? `Major ${majorTrim}. ` : "";

  return `OSU week recap for ${playerName} (${standing}, Y${year} W${week}). ${majorBit}Activities: ${activityText}
Now: GPA ${gpaNow}, H${hNow} Ha${hapNow} So${sNow} Lk${looksNow} | Wk1 baseline GPA ${gpaBase} H${hBase} Ha${hapBase} So${sBase} Lk${looksBase} | $${money} | ${job}

Reply with exactly ONE sentence, max 28 words. Stick to listed activities/stats only—no new characters, relationships, or invented events. Name OSU/Corvallis only if an activity was there. Money/job/major only if one short phrase fits. No emojis.`;
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
  return `Invent one college-life dilemma for "${playerName}", a ${standing} at Oregon State University (Year ${year}, Week ${week}). This week they: ${activityText}. Write in this exact style — short, casual, funny, grounded. Examples of the tone and format to match: "Fire alarm at McNary at 3am — sirens, stairs, and half-dressed hallmates on the lawn. Nobody sleeps; nobody wins." and "Ran into your professor at Downward Dog — yoga mats and small talk about the syllabus. Weirdly human." Keep the title punchy and short. Description should be 2 sentences max. Do not write generic study-vs-party dilemmas. Use this seed for a unique angle: ${uniquenessHint}\n\nRespond with only valid JSON, no markdown fences: { "title": string, "description": string, "choices": [{ "label": string, "consequence": { "gpa"?: number, "health"?: number, "happiness"?: number, "social"?: number, "message": string } }, { "label": string, "consequence": { ... } }] }. Two choices only. Stat deltas -15 to 15. No sexual content.`;
}

/**
 * @param {string} playerName
 * @param {number} year
 * @param {number} week
 * @param {unknown[]} chosenActivities
 * @param {{ gpa?: number; health?: number; happiness?: number; social?: number }} currentStats
 * @param {{ gpa?: number; health?: number; happiness?: number; social?: number }} week1BaselineStats
 * @param {number} [moneyDollars]
 * @param {string} [jobLine]
 * @param {string} [playerMajor]
 * @returns {Promise<string>}
 */
export async function generateCutscene(
  playerName,
  year,
  week,
  chosenActivities,
  currentStats,
  week1BaselineStats,
  moneyDollars = 0,
  jobLine = "",
  playerMajor = "",
) {
  try {
    const userPrompt = buildCutsceneUserPrompt(
      playerName,
      year,
      week,
      chosenActivities,
      currentStats,
      week1BaselineStats,
      moneyDollars,
      jobLine,
      playerMajor,
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
    const attractiveness = Number(finalStats?.attractiveness) || 0;

    const userPrompt =
      `Write a 3-sentence graduation reflection for ${playerName} at Oregon State University. Their final stats: GPA ${gpa}, Health ${health}/100, Happiness ${happiness}/100, Social ${social}/100, Looks (attractiveness) ${attractiveness}/100. Write a tone-appropriate custom ending that reflects this specific stat combination.`;

    return await callAnthropicMessages(userPrompt, MAX_TOKENS_ENDING);
  } catch {
    return FALLBACK_ENDING;
  }
}
