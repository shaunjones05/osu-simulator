import { ACTIVITIES } from "./gameData.js";

const STAT_KEYS = ["gpa", "health", "happiness", "social"];

const activityById = new Map(ACTIVITIES.map((a) => [a.id, a]));

function clampStat(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/**
 * @param {Record<string, number>} currentStats
 * @param {string[]} activityIds
 */
export function applyEffects(currentStats, activityIds) {
  const ids = Array.isArray(activityIds) ? activityIds : [];
  const delta = { gpa: 0, health: 0, happiness: 0, social: 0 };
  for (const id of ids) {
    const activity = activityById.get(id);
    if (!activity) continue;
    for (const key of STAT_KEYS) {
      delta[key] += activity.effects[key];
    }
  }
  const next = { ...currentStats };
  for (const key of STAT_KEYS) {
    const base = Number(currentStats[key]) || 0;
    next[key] = clampStat(base + delta[key]);
  }
  return next;
}

/**
 * @param {Record<string, number>} stats
 * @returns {{ isOver: boolean, reason: string }}
 */
export function checkGameOver(stats) {
  if (stats.gpa < 20) {
    return { isOver: true, reason: "expelled" };
  }
  if (stats.health < 15) {
    return { isOver: true, reason: "medical withdrawal" };
  }
  return { isOver: false, reason: "" };
}

/**
 * Inter-stat rules: low happiness halves positive GPA gains for the week (needs prior snapshot).
 * Low social drains happiness by 3.
 *
 * @param {Record<string, number>} stats — stats after activity effects this week
 * @param {Record<string, number>} [priorStats] — stats at week start; omit to skip GPA halving
 */
export function applyInteractions(stats, priorStats) {
  const next = { ...stats };

  if (priorStats != null && priorStats.happiness < 20) {
    const gpaGain = Math.max(0, stats.gpa - priorStats.gpa);
    if (gpaGain > 0) {
      next.gpa = clampStat(priorStats.gpa + gpaGain / 2);
    }
  }

  if (stats.social < 10) {
    next.happiness = clampStat(next.happiness - 3);
  }

  return next;
}

/**
 * @param {number} gpaScore — internal 0–100 scale
 * @returns {number} display GPA 0.0–4.0
 */
export function calculateGPADisplay(gpaScore) {
  const s = Number(gpaScore) || 0;
  return (clampStat(s) / 100) * 4;
}
