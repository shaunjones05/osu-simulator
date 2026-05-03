/**
 * @typedef {{ gpa?: number; health?: number; happiness?: number; social?: number; message?: string }} ScenarioConsequence
 * @typedef {{ label: string; consequence: ScenarioConsequence }} ScenarioChoice
 * @typedef {{
 *   year?: number;
 *   week?: number;
 *   weekRange?: [number, number];
 *   everyYear?: boolean;
 *   randomYear?: number[];
 * }} ScenarioTrigger
 * @typedef {{
 *   id: string;
 *   title: string;
 *   description: string;
 *   choices: ScenarioChoice[];
 *   triggerCondition: ScenarioTrigger;
 *   oneTime: boolean;
 * }} Scenario
 */

/** @type {Scenario[]} Order: week-3 Halloween before year-1 dorm so week 3 every year can be Halloween. */
export const GUARANTEED_SCENARIOS = [
  {
    id: "halloween_party",
    title: "Halloween Party or Midterms? 🎃",
    description:
      "It's week 3, midterms are around the corner, and Greek Row is going absolutely crazy tonight.",
    triggerCondition: { week: 3, everyYear: true },
    oneTime: false,
    choices: [
      {
        label: "Darty szn 🎃",
        consequence: {
          gpa: -8,
          happiness: 15,
          social: 20,
          message:
            "Best Halloween of your life. You'll deal with midterms... eventually.",
        },
      },
      {
        label: "Hit the books 📖",
        consequence: {
          gpa: 10,
          happiness: -5,
          social: -5,
          message: "Responsible. Boring. But your GPA thanks you.",
        },
      },
    ],
  },
  {
    id: "dorm_party",
    title: "Dorm Party Invite",
    description:
      "Your neighbor knocks — there's a party down the hall. You've got an exam coming up though...",
    triggerCondition: { year: 1, weekRange: [1, 3] },
    oneTime: true,
    choices: [
      {
        label: "Go to the party 🎉",
        consequence: {
          gpa: -5,
          health: -5,
          happiness: 15,
          social: 15,
          message:
            "The dorm party was just 6 dudes and you got really drunk and threw up everywhere.",
        },
      },
      {
        label: "Stay and study 📚",
        consequence: {
          gpa: 10,
          health: 2,
          happiness: -5,
          social: -5,
          message:
            "You crammed all night. Boring, but your notes have never looked better.",
        },
      },
    ],
  },
  {
    id: "late_night_decision",
    title: "A Late Night Decision",
    description:
      "Someone you've been talking to invites you back to their place. One problem — you're not prepared.",
    triggerCondition: { randomYear: [2, 3, 4] },
    oneTime: true,
    choices: [
      {
        label: "Go for it 😬",
        consequence: {
          health: -20,
          happiness: -10,
          message:
            "Rookie mistake. A trip to the student health center later confirmed your worst fears. Take care of yourself out there.",
        },
      },
      {
        label: "Pussy… lol",
        consequence: {
          message:
            "You played it safe. No changes, no regrets. Well, maybe a few regrets.",
        },
      },
    ],
  },
];

/**
 * @param {string} scenarioId
 * @param {number} year
 * @returns {string}
 */
function usedKeyForScenario(scenarioId, year) {
  if (scenarioId === "halloween_party") return `${scenarioId}:${year}`;
  return scenarioId;
}

/**
 * @param {string} key
 * @param {string[]} usedScenarioIds
 */
function isScenarioUsed(key, usedScenarioIds) {
  const used = Array.isArray(usedScenarioIds) ? usedScenarioIds : [];
  return used.includes(key);
}

/**
 * @param {ScenarioTrigger} t
 * @param {number} year
 * @param {number} week
 * @returns {boolean}
 */
function matchesTrigger(t, year, week) {
  if (t.week !== undefined && t.everyYear) {
    return week === t.week;
  }
  if (t.year !== undefined && Array.isArray(t.weekRange)) {
    const [a, b] = t.weekRange;
    return year === t.year && week >= a && week <= b;
  }
  if (Array.isArray(t.randomYear) && t.randomYear.length > 0) {
    if (!t.randomYear.includes(year)) return false;
    /** One-time slot: junior year week 2 (week 3 is Halloween every year). */
    return year === 3 && week === 2;
  }
  return false;
}

/**
 * @param {number} year
 * @param {number} week
 * @param {string[]} usedScenarioIds
 * @returns {Scenario | null}
 */
export function getScenarioForWeek(year, week, usedScenarioIds) {
  const y = Number(year);
  const w = Number(week);
  if (!Number.isFinite(y) || !Number.isFinite(w)) return null;

  for (const scenario of GUARANTEED_SCENARIOS) {
    const key = usedKeyForScenario(scenario.id, y);
    if (scenario.oneTime && isScenarioUsed(key, usedScenarioIds)) continue;
    if (!scenario.oneTime && isScenarioUsed(key, usedScenarioIds)) continue;

    if (matchesTrigger(scenario.triggerCondition, y, w)) {
      return scenario;
    }
  }
  return null;
}
