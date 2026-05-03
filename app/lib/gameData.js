/** Activity definitions — EP costs and stat deltas from OSU Simulator master plan. */

export const ACTIVITIES = [
  {
    id: "study-valley-library",
    name: "Study at Valley Library",
    location: "Valley Library, Oregon State University",
    epCost: 3,
    sceneImage: "library.png",
    effects: { gpa: 8, health: -2, happiness: -1, social: 0 },
  },
  {
    id: "class-cordley-hall",
    name: "Attend class at Cordley Hall",
    location: "Cordley Hall, Oregon State University",
    epCost: 2,
    sceneImage: "kelley.png",
    effects: { gpa: 5, health: 0, happiness: 0, social: 2 },
  },
  {
    id: "gym-dixon-rec",
    name: "Gym at Dixon Rec Center",
    location: "Dixon Recreation Center, Oregon State University",
    epCost: 3,
    sceneImage: "gym.png",
    effects: { gpa: 0, health: 10, happiness: 3, social: 2 },
  },
  {
    id: "frat-party-26th",
    name: "Frat party on 26th Street",
    location: "Greek Row (26th Street), Corvallis",
    epCost: 3,
    sceneImage: "party.png",
    effects: { gpa: -3, health: -5, happiness: 10, social: 10 },
  },
  {
    id: "football-reser",
    name: "Football game at Reser Stadium",
    location: "Reser Stadium, Oregon State University",
    epCost: 2,
    sceneImage: "stadium.png",
    effects: { gpa: 0, health: 0, happiness: 8, social: 8 },
  },
  {
    id: "eat-arnold-dining",
    name: "Eat at Arnold Dining Hall",
    location: "Arnold Dining Hall, Oregon State University",
    epCost: 1,
    sceneImage: "dining.png",
    effects: { gpa: 0, health: 5, happiness: 3, social: 2 },
  },
  {
    id: "downward-dog-tiki-tuesday",
    name: "Downward Dog Tiki Tuesday",
    location: "Downward Dog, Corvallis",
    epCost: 2,
    sceneImage: "tiki.png",
    effects: { gpa: -1, health: 3, happiness: 8, social: 8 },
  },
  {
    id: "rivas-taco-shop",
    name: "Late night Rivas Taco Shop",
    location: "Rivas Taco Shop, Corvallis",
    epCost: 1,
    sceneImage: "rivas.png",
    effects: { gpa: 0, health: 3, happiness: 7, social: 4 },
  },
  {
    id: "sleep-in",
    name: "Sleep in",
    location: "On-campus housing, Corvallis",
    epCost: 1,
    sceneImage: "dorm.png",
    effects: { gpa: 1, health: 6, happiness: 2, social: 0 },
  },
  {
    id: "club-mu",
    name: "Join a club at MU",
    location: "Memorial Union (MU), Oregon State University",
    epCost: 3,
    sceneImage: "stadium.png",
    effects: { gpa: 1, health: 0, happiness: 4, social: 7 },
  },
  {
    id: "study-group-kelley",
    name: "Study group at Kelley Engineering Center",
    location: "Kelley Engineering Center, Oregon State University",
    epCost: 3,
    sceneImage: "kelley.png",
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
  year1: 5,
  year2: 5,
  year3: 5,
  year4: 5,
};

/**
 * Campus jobs — player holds at most one. `epCost` is charged each week on End Week; `weeklyPay` is added then.
 * `minYear` / `maxYear` gate eligibility (inclusive).
 * @type {Array<{ id: string; name: string; location: string; epCost: number; weeklyPay: number; description: string; minYear?: number; maxYear?: number }>}
 */
export const JOBS = [
  {
    id: "job-dutch-barista",
    name: "Campus Barista",
    location: "Dutch Bros on campus",
    epCost: 2,
    weeklyPay: 150,
    description: "Early shifts, syrup pumps, and regulars who remember your name.",
  },
  {
    id: "job-library-assistant",
    name: "Library Assistant",
    location: "Valley Library",
    epCost: 2,
    weeklyPay: 175,
    description: "Stacks, scanners, and whisper-quiet drama in the stacks.",
  },
  {
    id: "job-mu-food-court",
    name: "MU Food Court Worker",
    location: "Memorial Union",
    epCost: 3,
    weeklyPay: 225,
    description: "Rush-hour trays, fryer alarms, and free shift meals when the manager looks away.",
  },
  {
    id: "job-research-cordley",
    name: "Research Assistant",
    location: "Cordley Hall",
    epCost: 4,
    weeklyPay: 300,
    description: "Pipettes, lab notebooks, and your name creeping toward a paper acknowledgments section.",
  },
  {
    id: "job-ra-mcnary",
    name: "Resident Advisor",
    location: "McNary Hall",
    epCost: 3,
    weeklyPay: 250,
    minYear: 2,
    description:
      "Floor meetings, duty rounds, and a built-in housing perk — your room is covered so you bank more of that paycheck.",
  },
  {
    id: "job-tech-kelley",
    name: "Tech Support",
    location: "Kelley Engineering Center",
    epCost: 4,
    weeklyPay: 350,
    description: "Ticket queues, ghosted VPNs, and professors who think rebooting is a personality.",
  },
  {
    id: "job-intern-startup",
    name: "Internship",
    location: "Local Corvallis startup",
    epCost: 5,
    weeklyPay: 500,
    minYear: 3,
    description:
      "Equity jargon, Slack pings at midnight, and a résumé line that actually impresses recruiters.",
  },
];

/**
 * @param {typeof JOBS[number]} job
 * @param {number} year 1–4
 * @returns {boolean}
 */
export function jobIsAvailable(job, year) {
  const y = Number(year) || 1;
  const min = job.minYear != null ? Number(job.minYear) : 1;
  const max = job.maxYear != null ? Number(job.maxYear) : 4;
  return y >= min && y <= max;
}

/**
 * Shop & underground items. `effect` applies immediately on purchase (stats 0–100 scale).
 * `weeklyBonus` applies every week in passive phase after purchase (ongoing only).
 * @type {Array<{
 *   id: string;
 *   name: string;
 *   description: string;
 *   cost: number;
 *   effect: StatDelta;
 *   isOneTime: boolean;
 *   weeklyBonus: StatDelta | null;
 *   category?: "shop" | "underground";
 *   isFakeId?: boolean;
 *   fakeidRisk?: "high" | "low";
 * }>}
 */
export const SHOP = [
  {
    id: "shop-coffee-dutch",
    name: "Coffee from Dutch Bros",
    description: "Iced Americano, extra ice, zero regrets until the caffeine wears off.",
    cost: 6,
    effect: { happiness: 5, gpa: 3 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
  },
  {
    id: "shop-meal-local-boyz",
    name: "Meal at Local Boyz",
    description: "Platter-sized portions and a nap schedule you did not plan for.",
    cost: 12,
    effect: { health: 8, happiness: 6 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
  },
  {
    id: "shop-rivas-late",
    name: "Late night Rivas Taco run",
    description: "Al pastor, salsa verde, and the walk home smells like victory.",
    cost: 8,
    effect: { health: 5, happiness: 8, social: 3 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
  },
  {
    id: "shop-drinks-tiki",
    name: "Drinks at Downward Dog Tiki Tuesday",
    description: "Plastic cups, loud music, and tomorrow-you sends a vague apology text.",
    cost: 15,
    effect: { happiness: 10, social: 10, gpa: -2 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
  },
  {
    id: "shop-spring-break-newport",
    name: "Spring Break trip to Newport Beach",
    description: "Salt air, highway miles, and a group chat that will never die.",
    cost: 200,
    effect: { happiness: 20, social: 15, gpa: -5 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
  },
  {
    id: "shop-tailgate-supplies",
    name: "Tailgate supplies for football game",
    description: "Coolers, chips, and enough orange face paint to stain your soul.",
    cost: 25,
    effect: { happiness: 12, social: 12 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
  },
  {
    id: "shop-tutor-library",
    name: "Tutor session at Valley Library",
    description: "Whiteboard markers and someone who actually understands Chapter 7.",
    cost: 40,
    effect: { gpa: 15, happiness: 3 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
  },
  {
    id: "shop-concert-gill",
    name: "Concert at Gill Coliseum",
    description: "Floor seats, bass you feel in your ribs, and ringing ears until Monday.",
    cost: 45,
    effect: { happiness: 15, social: 10 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
  },
  {
    id: "shop-coffee-maker",
    name: "Coffee maker for dorm",
    description: "Four-cup salvation every morning without crossing Monroe.",
    cost: 35,
    effect: {},
    isOneTime: false,
    weeklyBonus: { gpa: 2, happiness: 2 },
    category: "shop",
  },
  {
    id: "shop-gym-shoes",
    name: "New gym shoes",
    description: "Arch support that Dixon Rec never gave you for free.",
    cost: 60,
    effect: {},
    isOneTime: false,
    weeklyBonus: { health: 2 },
    category: "shop",
  },
  {
    id: "shop-textbooks-used",
    name: "Textbooks (used)",
    description: "Highlights from someone smarter than you — steal their margin notes.",
    cost: 80,
    effect: {},
    isOneTime: false,
    weeklyBonus: { gpa: 3 },
    category: "shop",
  },
  {
    id: "shop-laptop-upgrade",
    name: "Laptop upgrade",
    description: "Fans spin less, compile times drop, and Canvas loads before you rage-quit.",
    cost: 200,
    effect: {},
    isOneTime: false,
    weeklyBonus: { gpa: 4, happiness: 2 },
    category: "shop",
  },
  {
    id: "underground-fake-id-cheap",
    name: 'Cheap Fake ID from “some guy on Reddit”',
    description:
      "A JPEG of a JPEG of an ID. It scans until it does not. You were warned.",
    cost: 40,
    effect: { social: 15 },
    isOneTime: true,
    weeklyBonus: null,
    category: "underground",
    isFakeId: true,
    fakeidRisk: "high",
  },
  {
    id: "underground-fake-id-premium",
    name: 'Premium Fake ID from a “professional”',
    description:
      "Hologram that almost passes the squint test. Still illegal — just slower to fall apart.",
    cost: 120,
    effect: { social: 15 },
    isOneTime: true,
    weeklyBonus: null,
    category: "underground",
    isFakeId: true,
    fakeidRisk: "low",
  },
];

/**
 * Fake-ID arrest weekly roll (separate from {@link getRandEvent}).
 * @param {"none" | "high" | "low"} fakeidRisk
 * @returns {{ title: string; description: string; effect: StatDelta; moneyDelta: number } | null}
 */
export function rollFakeIdArrest(fakeidRisk) {
  if (fakeidRisk !== "high" && fakeidRisk !== "low") return null;
  const chance = fakeidRisk === "high" ? 0.2 : 0.05;
  if (Math.random() >= chance) return null;
  const hard = fakeidRisk === "high";
  return {
    title: "Caught with a fake ID — arrested",
    description: hard
      ? "Corvallis PD pulls you outside Downward Dog. Lights flash, cuffs click, and your night ends in paperwork. Parents get the voicemail. Lawyer fees drain your account before the ink dries."
      : "A bouncer flags the laminate shimmer. Corvallis PD gets involved, but your “professional” hookup keeps charges lighter — still expensive, still humiliating, still on your record in the group chat.",
    effect: hard
      ? { social: -20, happiness: -25, gpa: -15 }
      : { social: -15, happiness: -20, gpa: -10 },
    moneyDelta: hard ? -200 : -150,
  };
}

/** @typedef {{ gpa?: number; health?: number; happiness?: number; social?: number }} StatDelta */

/**
 * Random weekly events (PDR). `effect` is a partial stat delta (0–100 scale).
 * @type {Array<{ id: string; title: string; description: string; effect: StatDelta; isBet?: boolean; betAmount?: number }>}
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
  {
    id: "blazers-bet",
    title: "The Blazers are playing tonight",
    description:
      "Your roommate slides their phone across the table. 'Wanna throw $20 on the Blazers?' 50/50. Your call.",
    effect: { happiness: 0 },
    isBet: true,
    betAmount: 20,
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

/**
 * Resolves the Blazers bet random event — 50/50 win with happiness swing.
 * @returns {{ won: boolean; message: string; effect: StatDelta }}
 */
export function getBlazersBetResult() {
  const won = Math.random() < 0.5;
  return {
    won,
    message: won
      ? "Blazers win. You're up $20 and insufferable about it."
      : "Blazers lose. You're down $20 and very quiet about it.",
    effect: won ? { happiness: 15 } : { happiness: -15 },
  };
}
