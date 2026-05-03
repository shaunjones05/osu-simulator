const STAT_KEYS = ["gpa", "health", "happiness", "social"];

function clampStat(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

/**
 * PDR v2.0 Health Multiplier System.
 * @param {number} health
 * @returns {number}
 */
export function getHealthMultiplier(health) {
  const h = Number(health);
  if (Number.isNaN(h)) return 1;

  if (h > 80) {
    return Math.min(1.2, 1.0 + (h - 80) * 0.01);
  }
  if (h < 60) {
    return Math.max(0.8, 1.0 - (60 - h) * 0.01);
  }
  return 1.0;
}

/**
 * @param {Record<string, number>} currentStats
 * @param {string[]} selectedActivityIds
 * @param {Array<{ id: string; effects?: Record<string, number> }>} activities
 * @returns {Record<string, number>}
 */
export function applyWeek(currentStats, selectedActivityIds, activities) {
  const ids = Array.isArray(selectedActivityIds) ? selectedActivityIds : [];
  const list = Array.isArray(activities) ? activities : [];

  const byId = new Map(list.map((a) => [a?.id, a]));

  const baseHealth = Number(currentStats?.health) || 0;
  const mult = getHealthMultiplier(baseHealth);

  let gpa = Number(currentStats?.gpa) || 0;
  let health = baseHealth;
  let happiness = Number(currentStats?.happiness) || 0;
  let social = Number(currentStats?.social) || 0;

  for (const id of ids) {
    const activity = byId.get(id);
    if (!activity?.effects) continue;
    const e = activity.effects;
    health += Number(e.health) || 0;
    gpa += (Number(e.gpa) || 0) * mult;
    happiness += (Number(e.happiness) || 0) * mult;
    social += (Number(e.social) || 0) * mult;
  }

  const rounded = {
    gpa,
    health,
    happiness,
    social,
  };
  const next = { ...currentStats };
  for (const key of STAT_KEYS) {
    next[key] = clampStat(Math.round(rounded[key]));
  }
  return next;
}

/**
 * Post-week passive rules (PDR). Does not mutate `stats`.
 * @param {Record<string, number>} stats
 * @param {{ activePerks?: Array<{ weeklyBonus?: Record<string, number> | null }> }} [options]
 * @returns {Record<string, number>}
 */
export function applyPassiveEffects(stats, options) {
  const perks = options?.activePerks ?? [];

  let gpa = Number(stats?.gpa) || 0;
  let health = Number(stats?.health) || 0;
  let happiness = Number(stats?.happiness) || 0;
  let social = Number(stats?.social) || 0;

  for (const p of perks) {
    const b = p?.weeklyBonus;
    if (!b || typeof b !== "object") continue;
    gpa += Number(b.gpa) || 0;
    health += Number(b.health) || 0;
    happiness += Number(b.happiness) || 0;
    social += Number(b.social) || 0;
  }

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
 * @param {Record<string, number>} stats
 * @returns {{ isOver: boolean, reason: string }}
 */
/**
 * First frat-party coke offer: choice 0 = take it (40% overdose game over), 1 = hard pass.
 * @param {number} choiceIndex
 * @returns {{ gameOver?: boolean; happiness?: number; social?: number; message: string }}
 */
export function resolveFirstPartyCokeChoice(choiceIndex) {
  if (choiceIndex === 1) {
    return {
      happiness: 5,
      social: 2,
      message: "You kept it moving. Still had a good night.",
    };
  }
  if (Math.random() < 0.4) {
    return {
      gameOver: true,
      message: "You overdosed. Your college story ends here.",
    };
  }
  return {
    happiness: 100,
    message:
      "The night was unreal. You're not sure you've ever felt more alive.",
  };
}

/** Pending job application: 70% acceptance if GPA already qualified at apply time. */
export function rollJobApplicationAccepted() {
  return Math.random() < 0.7;
}

/** Crypto weekly: 50% gain 30% of balance vs lose 30%. */
export function rollCryptoWeeklyGain() {
  return Math.random() < 0.5;
}

/**
 * @param {number} currentMoney
 * @returns {number} signed dollar change (gain positive, loss negative)
 */
export function cryptoWeeklyMoneyDelta(currentMoney) {
  const m = Math.max(0, Math.round(Number(currentMoney) || 0));
  const amt = Math.round(m * 0.3);
  if (amt <= 0) return 0;
  return rollCryptoWeeklyGain() ? amt : -amt;
}

/**
 * @returns {number} uniform in [0.3, 2.0]
 */
export function rollGamblingMultiplier() {
  return 0.3 + Math.random() * 1.7;
}

/**
 * Net money change from gambling (bet is stake; multiplier applied to payout).
 * @param {number} betAmount
 * @param {number} multiplier
 * @returns {number}
 */
export function gamblingNetMoneyDelta(betAmount, multiplier) {
  const b = Math.max(0, Math.round(Number(betAmount) || 0));
  const m = Number(multiplier);
  if (!Number.isFinite(m) || b <= 0) return 0;
  return Math.round(b * (m - 1));
}

export function checkGameOver(stats) {
  const health = Number(stats?.health) || 0;
  const gpa = Number(stats?.gpa) || 0;

  if (health < 15) {
    return {
      isOver: true,
      reason: "Medical Withdrawal — your body gave out",
    };
  }
  if (gpa < 10) {
    return {
      isOver: true,
      reason: "Expelled — GPA dropped below 1.0",
    };
  }
  return { isOver: false, reason: "" };
}

/**
 * PDR v2.0 endings (first match wins).
 * @param {Record<string, number>} finalStats
 * @returns {{ title: string; description: string; color: string } | null}
 */
export function getEnding(finalStats) {
  const gpa = Number(finalStats?.gpa) || 0;
  const health = Number(finalStats?.health) || 0;
  const happiness = Number(finalStats?.happiness) || 0;
  const social = Number(finalStats?.social) || 0;

  if (gpa >= 90 && (social < 30 || happiness < 30)) {
    return {
      title: "Straight-A Hermit",
      description:
        "You crushed the books and the curve, but the quad barely knows your name. Diplomas are loud; your dorm was quieter.",
      color: "#5c6bc0",
    };
  }

  if (gpa >= 85 && happiness >= 60 && social >= 50) {
    return {
      title: "Dean's List Graduate",
      description:
        "Grades stayed high, spirits stayed higher, and you still made time for people who matter. That is the full ride.",
      color: "#00897b",
    };
  }

  if (social >= 85 && happiness >= 80 && gpa < 70) {
    return {
      title: "The Social Legend",
      description:
        "Everyone knows your name at the MU, the tailgates, and the late-night spots. The transcript is not the headline — you are.",
      color: "#ff7043",
    };
  }

  if (gpa >= 55 && health >= 55 && happiness >= 55 && social >= 55) {
    return {
      title: "The Balanced Beaver",
      description:
        "Body, mind, grades, and crew — nothing hit zero, nothing burned out. Steady orange and black all four years.",
      color: "#d84315",
    };
  }

  if (gpa >= 10 && gpa <= 30) {
    return {
      title: "Academic Probation",
      description:
        "You crossed the line more than once on purpose or by drift. OSU kept you on paper — now it is on you to climb back.",
      color: "#c62828",
    };
  }

  return null;
}
