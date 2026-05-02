const STAT_KEYS = ["gpa", "health", "happiness", "social"];

function clampStat(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/**
 * @param {Record<string, number>} currentStats
 * @param {Array<{ effects: Record<string, number> }>} activities — chosen activity objects (e.g. from ACTIVITIES)
 */
export function applyActivityEffects(currentStats, activities) {
  const list = Array.isArray(activities) ? activities : [];
  const delta = { gpa: 0, health: 0, happiness: 0, social: 0 };

  for (const activity of list) {
    if (!activity?.effects) continue;
    for (const key of STAT_KEYS) {
      delta[key] += Number(activity.effects[key]) || 0;
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
  if (stats.health < 15) {
    return {
      isOver: true,
      reason: "Medical withdrawal — your health collapsed",
    };
  }
  if (stats.gpa < 10) {
    return {
      isOver: true,
      reason: "Academic probation — you've been expelled",
    };
  }
  return { isOver: false, reason: "" };
}

/**
 * End-of-week passive rules. Does not mutate `stats`.
 *
 * @param {Record<string, number>} stats
 */
export function applyPassiveEffects(stats) {
  let gpa = Number(stats.gpa) || 0;
  let health = Number(stats.health) || 0;
  let happiness = Number(stats.happiness) || 0;
  let social = Number(stats.social) || 0;

  if (happiness < 20) {
    gpa -= 3;
    health -= 2;
  }
  if (social < 10) {
    happiness -= 3;
  }

  return {
    ...stats,
    gpa: clampStat(gpa),
    health: clampStat(health),
    happiness: clampStat(happiness),
    social: clampStat(social),
  };
}

/**
 * Final score 0–100 from stats (equal weight per stat). `week` / `year` reserved for future modifiers.
 *
 * @param {Record<string, number>} stats
 * @param {number} week
 * @param {number} year
 */
export function calculateFinalScore(stats, week, year) {
  void week;
  void year;
  const gpa = Number(stats.gpa) || 0;
  const health = Number(stats.health) || 0;
  const happiness = Number(stats.happiness) || 0;
  const social = Number(stats.social) || 0;
  const average = (gpa + health + happiness + social) / STAT_KEYS.length;
  return clampStat(average);
}
