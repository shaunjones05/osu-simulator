/** Activity definitions — EP costs and stat deltas from OSU Simulator master plan. */

export const ACTIVITIES = [
  {
    id: "study-valley-library",
    name: "Study at Valley Library",
    location: "Valley Library, Oregon State University",
    epCost: 3,
    effects: { gpa: 8, health: -2, happiness: -1, social: 0 },
  },
  {
    id: "class-cordley-hall",
    name: "Attend class at Cordley Hall",
    location: "Cordley Hall, Oregon State University",
    epCost: 2,
    effects: { gpa: 5, health: 0, happiness: 0, social: 2 },
  },
  {
    id: "gym-dixon-rec",
    name: "Gym at Dixon Rec Center",
    location: "Dixon Recreation Center, Oregon State University",
    epCost: 3,
    effects: { gpa: 0, health: 10, happiness: 3, social: 2 },
  },
  {
    id: "frat-party-26th",
    name: "Frat party on 26th Street",
    location: "Greek Row (26th Street), Corvallis",
    epCost: 3,
    effects: { gpa: -3, health: -5, happiness: 10, social: 10 },
  },
  {
    id: "football-reser",
    name: "Football game at Reser Stadium",
    location: "Reser Stadium, Oregon State University",
    epCost: 2,
    effects: { gpa: 0, health: 0, happiness: 8, social: 8 },
  },
  {
    id: "eat-arnold-dining",
    name: "Eat at Arnold Dining Hall",
    location: "Arnold Dining Hall, Oregon State University",
    epCost: 1,
    effects: { gpa: 0, health: 5, happiness: 3, social: 2 },
  },
  {
    id: "downward-dog-tiki-tuesday",
    name: "Downward Dog Tiki Tuesday",
    location: "Downward Dog, Corvallis",
    epCost: 2,
    effects: { gpa: -1, health: 3, happiness: 8, social: 8 },
  },
  {
    id: "rivas-taco-shop",
    name: "Late night Rivas Taco Shop",
    location: "Rivas Taco Shop, Corvallis",
    epCost: 1,
    effects: { gpa: 0, health: 3, happiness: 7, social: 4 },
  },
  {
    id: "sleep-in",
    name: "Sleep in",
    location: "On-campus housing, Corvallis",
    epCost: 1,
    effects: { gpa: 1, health: 6, happiness: 2, social: 0 },
  },
  {
    id: "club-mu",
    name: "Join a club at MU",
    location: "Memorial Union (MU), Oregon State University",
    epCost: 3,
    effects: { gpa: 1, health: 0, happiness: 4, social: 7 },
  },
  {
    id: "study-group-kelley",
    name: "Study group at Kelley Engineering Center",
    location: "Kelley Engineering Center, Oregon State University",
    epCost: 3,
    effects: { gpa: 7, health: 0, happiness: 2, social: 4 },
  },
];

export const INITIAL_STATS = {
  gpa: 50,
  health: 70,
  happiness: 65,
  social: 40,
};

export const ENERGY_BY_YEAR = {
  year1: 13,
  year2: 12,
  year3: 11,
  year4: 14,
};

/** @typedef {{ gpa?: number; health?: number; happiness?: number; social?: number }} StatDelta */

/**
 * Random weekly events (PDR). `effect` is a partial stat delta (0–100 scale).
 * @type {Array<{ id: string; title: string; description: string; effect: StatDelta }>}
 */
export const RANDOM_EVENTS = [
  {
    id: "fire-alarm-mcnary-3am",
    title: "Fire alarm at McNary at 3am",
    description:
      "Sirens, stairs, and half-dressed hallmates on the lawn. Nobody sleeps; nobody wins.",
    effect: { health: -5, happiness: -8 },
  },
  {
    id: "free-pizza-mu-quad",
    title: "Free pizza in the MU quad",
    description:
      "Someone’s club ran a tab and the boxes are still hot. You eat like royalty between classes.",
    effect: { happiness: 10, health: 5 },
  },
  {
    id: "professor-cancelled-class",
    title: "Professor cancelled class",
    description:
      "Email hits at 8:02. The rest of the day opens up like a gift you did not earn.",
    effect: { happiness: 8, gpa: 3 },
  },
  {
    id: "professor-downward-dog",
    title: "Ran into your professor at Downward Dog",
    description:
      "Yoga mats and small talk about the syllabus. Weirdly human; weirdly good for your grade energy.",
    effect: { gpa: 5, social: 5 },
  },
  {
    id: "beaver-classic-game-day",
    title: "Beaver Classic game day",
    description:
      "Orange in the streets, noise in the stadium, homework deferred without guilt.",
    effect: { social: 15, happiness: 10, gpa: -3 },
  },
  {
    id: "midterm-forgot",
    title: "Midterm you forgot about",
    description:
      "Canvas notification you swiped away finally bites. The room is quiet except for your pulse.",
    effect: { gpa: -10, happiness: -8 },
  },
  {
    id: "met-friend-dixon",
    title: "Met a new friend at Dixon",
    description:
      "Spotter becomes brunch buddy. Corvallis feels smaller in the best way.",
    effect: { social: 12, happiness: 6 },
  },
  {
    id: "corvallis-rain-stuck-inside",
    title: "Corvallis rain — stuck inside all week",
    description:
      "Gray sky, wet bike seat, and four walls. You mainline screens and miss the sun.",
    effect: { happiness: -5, health: -3 },
  },
];

/**
 * Calendar special events keyed by `"year-week"` (e.g. `"1-4"`).
 * Most entries use a plain `effect` object. For GPA branches, `effect` is a function
 * `(stats) => StatDelta` — resolve with `typeof e.effect === "function" ? e.effect(stats) : e.effect`.
 * @type {Record<string, { title: string; description: string; effect: StatDelta | ((stats: Record<string, number>) => StatDelta); isMandatory: boolean }>}
 */
export const SPECIAL_EVENTS = {
  "1-1": {
    title: "START Orientation",
    description:
      "Name games, campus tours, and free swag. You meet half your floor before sundown.",
    effect: { social: 20, happiness: 10 },
    isMandatory: true,
  },
  "1-4": {
    title: "First Midterms",
    description:
      "First real exams land. If you were already drowning, the curve does not save you — if you were steady, you rise.",
    effect: (stats) => {
      const gpa = Number(stats?.gpa) || 0;
      return gpa < 60 ? { gpa: -8 } : { gpa: 5 };
    },
    isMandatory: true,
  },
  "1-8": {
    title: "Fall Finals",
    description:
      "Dead week is a lie and Reser is a dream. Either you cram through the wall or you close strong.",
    effect: (stats) => {
      const gpa = Number(stats?.gpa) || 0;
      return gpa < 50 ? { gpa: -10 } : { gpa: 8 };
    },
    isMandatory: true,
  },
  "2-3": {
    title: "Beaver Classic Football Weekend",
    description:
      "Tailgates, chants, and zero regret until Monday. Homework can wait; the Beavers cannot.",
    effect: { social: 15, happiness: 12, gpa: -5 },
    isMandatory: false,
  },
  "3-4": {
    title: "Junior Internship Fair at MU",
    description:
      "Resume paper, free pens, and recruiters who actually read your major. The career path gets real.",
    effect: { gpa: 5, social: 8 },
    isMandatory: false,
  },
  "4-1": {
    title: "Senior Week Kickoff",
    description:
      "Caps ordered, cameras out, and every goodbye starts with “we should hang this summer.”",
    effect: { happiness: 15, social: 10 },
    isMandatory: false,
  },
};

/**
 * 25% chance returns one random event from {@link RANDOM_EVENTS}, otherwise `null`.
 * @returns {(typeof RANDOM_EVENTS)[number] | null}
 */
export function getRandEvent() {
  if (Math.random() >= 0.25) return null;
  const list = RANDOM_EVENTS;
  const i = Math.floor(Math.random() * list.length);
  return list[i] ?? null;
}

/**
 * @param {number} year
 * @param {number} week
 * @returns {(typeof SPECIAL_EVENTS)[string] | null}
 */
export function getSpecialEvent(year, week) {
  const key = `${year}-${week}`;
  const ev = SPECIAL_EVENTS[key];
  return ev ?? null;
}
