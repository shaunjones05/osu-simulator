/** Activity definitions — EP costs and stat deltas from OSU Simulator master plan. */

export const ACTIVITIES = [
  {
    id: "study-valley-library",
    name: "Study at Valley Library",
    location: "Valley Library, Oregon State University",
    epCost: 2,
    sceneImage: "library.png",
    effects: { gpa: 6, health: -2, happiness: -1, social: 0 },
  },
  {
    id: "gym-dixon-rec",
    name: "Gym at Dixon Rec Center",
    location: "Dixon Recreation Center, Oregon State University",
    epCost: 2,
    sceneImage: "gym.png",
    effects: { gpa: 0, health: 7, happiness: 2, social: 1 },
  },
  {
    id: "frat-party-26th",
    name: "Frat party on 26th Street",
    location: "Greek Row (26th Street), Corvallis",
    epCost: 2,
    sceneImage: "party.png",
    effects: { gpa: -3, health: -5, happiness: 7, social: 7 },
  },
  {
    id: "football-reser",
    name: "Football game at Reser Stadium",
    location: "Reser Stadium, Oregon State University",
    epCost: 1,
    sceneImage: "stadium.png",
    effects: { gpa: 0, health: 0, happiness: 6, social: 6 },
  },
  {
    id: "eat-arnold-dining",
    name: "Eat at Arnold Dining Hall",
    location: "Arnold Dining Hall, Oregon State University",
    epCost: 1,
    sceneImage: "dining.png",
    effects: { gpa: 0, health: 4, happiness: 2, social: 1 },
  },
  {
    id: "sleep-in",
    name: "Sleep in",
    location: "On-campus housing, Corvallis",
    epCost: 1,
    sceneImage: "dorm.png",
    effects: { gpa: 1, health: 4, happiness: 1, social: 0 },
  },
  {
    id: "club-mu",
    name: "Join a club at MU",
    location: "Memorial Union (MU), Oregon State University",
    epCost: 2,
    sceneImage: "stadium.png",
    effects: { gpa: 1, health: 0, happiness: 3, social: 5 },
  },
  {
    id: "study-group-kelley",
    name: "Study group at Kelley Engineering Center",
    location: "Kelley Engineering Center, Oregon State University",
    epCost: 2,
    sceneImage: "kelley.png",
    effects: { gpa: 5, health: 0, happiness: 1, social: 3 },
  },
  {
    id: "gambling",
    name: "Gambling Night",
    location: "Private game, Corvallis",
    epCost: 1,
    sceneImage: "party.png",
    effects: { gpa: 0, health: 0, happiness: 4, social: 2 },
  },
];

/** One-time coke-at-party scenario (resolved in UI before the rest of the week). */
export const FIRST_PARTY_COKE_SCENARIO_ID = "first-party-coke";

export const FIRST_PARTY_COKE_SCENARIO = {
  id: FIRST_PARTY_COKE_SCENARIO_ID,
  title: "Someone offers you coke at the party",
  description:
    "It's your first party at OSU. Someone you just met holds out their hand. Your call.",
  choices: [
    {
      label: "Take it",
      consequence: {},
    },
    {
      label: "Hard pass",
      consequence: {
        happiness: 5,
        social: 2,
        message: "You kept it moving. Still had a good night.",
      },
    },
  ],
};

/** One-time Kalshi / Reser streaker bet — triggered from UI when energy goes to football-reser (50% roll). */
export const KALSHI_STREAKER_SCENARIO_ID = "kalshi-streaker-reser";

export const KALSHI_STREAKER_SCENARIO = {
  id: KALSHI_STREAKER_SCENARIO_ID,
  title: "Kalshi has insane odds on the next Reser streaker",
  description:
    "Your friend pulls up the app. 'Dude the odds are stupid favorable. We could make $15k.' The fine is $1000 and a night in jail. You're definitely getting caught.",
  choices: [
    {
      label: "Let's do it 🏃",
      consequence: {
        money: 14000,
        happiness: -10,
        social: 20,
        message:
          "You did it. Security tackled you at the 40-yard line. Spent the night in jail. Woke up $14,000 richer. Legend.",
      },
    },
    {
      label: "Hard pass",
      consequence: {
        happiness: 2,
        message: "You watched someone else do it instead. Respect.",
      },
    },
  ],
};

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
 * Campus jobs — player holds at most one. `epCost` is reserved/charged each week; `weeklyPay` added on End Week unless short on EP.
 * @type {Array<{
 *   id: string;
 *   name: string;
 *   location: string;
 *   epCost: number;
 *   weeklyPay: number;
 *   minGpa?: number;
 *   minYear?: number;
 *   maxYear?: number;
 *   description: string;
 *   isCrypto?: boolean;
 * }>}
 */
export const JOBS = [
  {
    id: "campus-barista",
    name: "Campus Barista",
    location: "Dutch Bros on campus",
    epCost: 2,
    weeklyPay: 150,
    minGpa: 0,
    description:
      "Early shifts, syrup pumps, and regulars who remember your name.",
  },
  {
    id: "library-assistant",
    name: "Library Assistant",
    location: "Valley Library",
    epCost: 2,
    weeklyPay: 175,
    minGpa: 45,
    description: "Stacks, scanners, and whisper-quiet drama in the stacks.",
  },
  {
    id: "mu-food-court",
    name: "MU Food Court Worker",
    location: "Memorial Union",
    epCost: 3,
    weeklyPay: 225,
    minGpa: 35,
    description:
      "Rush-hour trays, fryer alarms, and free shift meals when the manager looks away.",
  },
  {
    id: "research-assistant",
    name: "Research Assistant",
    location: "Cordley Hall",
    epCost: 4,
    weeklyPay: 300,
    minGpa: 70,
    description:
      "Pipettes, lab notebooks, and your name creeping toward a paper acknowledgments section.",
  },
  {
    id: "tech-support",
    name: "Tech Support",
    location: "Kelley Engineering Center",
    epCost: 4,
    weeklyPay: 350,
    minGpa: 65,
    description:
      "Ticket queues, ghosted VPNs, and professors who think rebooting is a personality.",
  },
  {
    id: "crypto-trader",
    name: "Crypto Trader",
    location: "Remote",
    epCost: 1,
    weeklyPay: 0,
    minGpa: 0,
    description: "High risk, high reward. 50/50 every week.",
    isCrypto: true,
  },
];

/**
 * @param {typeof JOBS[number]} job
 * @param {number} year 1–4
 * @param {number} [gpaInternal] 0–100 internal GPA scale
 * @returns {boolean}
 */
export function jobIsAvailable(job, year, gpaInternal) {
  const y = Number(year) || 1;
  const minY = job.minYear != null ? Number(job.minYear) : 1;
  const maxY = job.maxYear != null ? Number(job.maxYear) : 4;
  if (y < minY || y > maxY) return false;
  const g = Number(gpaInternal);
  const minG = job.minGpa != null ? Number(job.minGpa) : 0;
  if (!Number.isFinite(g)) return minG <= 0;
  return g >= minG;
}

/**
 * Bar / alcohol items: junior (year 3+) or an active fake ID from the Underground.
 * @param {{ minLegalPurchaseYear?: number }} item
 * @param {number} currentYear 1–4
 * @param {"none" | "high" | "low"} fakeidRisk
 * @returns {boolean}
 */
export function shopItemPassesAgeGate(item, currentYear, fakeidRisk) {
  const min = item.minLegalPurchaseYear;
  if (min == null) return true;
  const y = Number(currentYear) || 1;
  if (y >= min) return true;
  return fakeidRisk === "high" || fakeidRisk === "low";
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
 *   category?: "shop" | "underground" | "transport" | "collectible";
 *   isConsumable?: boolean;
 *   isFakeId?: boolean;
 *   fakeidRisk?: "high" | "low";
 *   minLegalPurchaseYear?: number;
 * }>}
 */
export const POKEMON_PACK_SHOP_ID = "pokemon-pack";

export const SHOP = [
  {
    id: "shop-coffee-dutch",
    name: "Coffee from Dutch Bros",
    description: "Iced Americano, extra ice, zero regrets until the caffeine wears off.",
    cost: 6,
    effect: { happiness: 3, gpa: 2, health: -1 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
    isConsumable: true,
  },
  {
    id: "shop-meal-local-boyz",
    name: "Meal at Local Boyz",
    description: "Platter-sized portions and a nap schedule you did not plan for.",
    cost: 12,
    effect: { health: 5, happiness: 4, social: 1, gpa: -1 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
    isConsumable: true,
  },
  {
    id: "shop-rivas-late",
    name: "Late night Rivas Taco run",
    description: "Al pastor, salsa verde, and the walk home smells like victory.",
    cost: 8,
    effect: { health: 2, happiness: 6, social: 3, gpa: -2 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
    isConsumable: true,
  },
  {
    id: "shop-drinks-tiki",
    name: "Drinks at Downward Dog Tiki Tuesday",
    description: "Plastic cups, loud music, and tomorrow-you sends a vague apology text.",
    cost: 15,
    effect: { happiness: 6, social: 7, health: -3, gpa: -3 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
    isConsumable: true,
    minLegalPurchaseYear: 3,
  },
  {
    id: "shop-spring-break-newport",
    name: "Spring Break trip to Newport Beach",
    description: "Salt air, highway miles, and a group chat that will never die.",
    cost: 200,
    effect: { happiness: 14, social: 11, gpa: -8, health: 4 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
    isConsumable: true,
  },
  {
    id: "shop-tailgate-supplies",
    name: "Tailgate supplies for football game",
    description: "Coolers, chips, and enough orange face paint to stain your soul.",
    cost: 25,
    effect: { happiness: 8, social: 8, gpa: -3, health: -2 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
    isConsumable: true,
  },
  {
    id: "shop-tutor-library",
    name: "Tutor session at Valley Library",
    description: "Whiteboard markers and someone who actually understands Chapter 7.",
    cost: 40,
    effect: { gpa: 11, happiness: 1, health: -1 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
    isConsumable: true,
  },
  {
    id: "shop-concert-gill",
    name: "Concert at Gill Coliseum",
    description: "Floor seats, bass you feel in your ribs, and ringing ears until Monday.",
    cost: 45,
    effect: { happiness: 10, social: 7, health: -2, gpa: -2 },
    isOneTime: true,
    weeklyBonus: null,
    category: "shop",
    isConsumable: true,
  },
  {
    id: "shop-coffee-maker",
    name: "Coffee maker for dorm",
    description: "Four-cup salvation every morning without crossing Monroe.",
    cost: 35,
    effect: {},
    isOneTime: false,
    weeklyBonus: { gpa: 1, happiness: 1 },
    category: "shop",
  },
  {
    id: "shop-gym-shoes",
    name: "New gym shoes",
    description: "Arch support that Dixon Rec never gave you for free.",
    cost: 60,
    effect: {},
    isOneTime: false,
    weeklyBonus: { health: 1 },
    category: "shop",
  },
  {
    id: "shop-textbooks-used",
    name: "Textbooks (used)",
    description: "Highlights from someone smarter than you — steal their margin notes.",
    cost: 80,
    effect: {},
    isOneTime: false,
    weeklyBonus: { gpa: 2 },
    category: "shop",
  },
  {
    id: "shop-laptop-upgrade",
    name: "Laptop upgrade",
    description: "Fans spin less, compile times drop, and Canvas loads before you rage-quit.",
    cost: 200,
    effect: {},
    isOneTime: false,
    weeklyBonus: { gpa: 3, happiness: 1 },
    category: "shop",
  },
  {
    id: "pokemon-pack",
    name: "Pokémon Pack",
    description: "Could be anything. Probably not a Charizard.",
    cost: 5,
    effect: {},
    isOneTime: true,
    weeklyBonus: null,
    category: "collectible",
    isConsumable: false,
  },
  {
    id: "bike",
    name: "Bike",
    description: "Gets you around campus faster.",
    cost: 100,
    effect: { health: 3 },
    isOneTime: true,
    weeklyBonus: null,
    category: "transport",
  },
  {
    id: "low-car",
    name: "Used Civic",
    description: "Low end but it runs.",
    cost: 1000,
    effect: { social: 1 },
    isOneTime: true,
    weeklyBonus: null,
    category: "transport",
  },
  {
    id: "mid-car",
    name: "Honda Accord",
    description: "Respectable. People notice.",
    cost: 6000,
    effect: { social: 6 },
    isOneTime: true,
    weeklyBonus: null,
    category: "transport",
  },
  {
    id: "luxury-car",
    name: "BMW 3 Series",
    description: "You pull up different now.",
    cost: 25000,
    effect: { social: 15 },
    isOneTime: true,
    weeklyBonus: null,
    category: "transport",
  },
  {
    id: "underground-fake-id-cheap",
    name: 'Cheap Fake ID from “some guy on Reddit”',
    description:
      "A JPEG of a JPEG of an ID. It scans until it does not. You were warned.",
    cost: 40,
    effect: { social: 11 },
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
    effect: { social: 11 },
    isOneTime: true,
    weeklyBonus: null,
    category: "underground",
    isFakeId: true,
    fakeidRisk: "low",
  },
];

/** Transport gear — multiple purchases stack immediate stat effects. */
export function shopItemStacksOnPurchase(item) {
  return Boolean(item && item.category === "transport");
}

/** Fake IDs cannot be quick-sold from the Assets tab. */
export function shopItemAllowsQuickSell(item) {
  return Boolean(item) && !item.isFakeId;
}

/** True if the player already owns any fake ID (only one fake ID per playthrough). */
export function playerOwnsAnyFakeIdAsset(ownedAssets) {
  if (!Array.isArray(ownedAssets)) return false;
  return ownedAssets.some((row) => {
    const def = SHOP.find((s) => s.id === row.shopItemId);
    return Boolean(def?.isFakeId);
  });
}

/** True if this row counts toward Assets tab and net worth (excludes consumables). */
export function assetRowContributesToNetWorth(row) {
  if (!row || typeof row !== "object") return false;
  if (row.kind === "pokemon") return true;
  const def = SHOP.find((s) => s.id === row.shopItemId);
  if (!def) return false;
  return !def.isConsumable;
}

export function filterAssetsForDisplay(ownedAssets) {
  if (!Array.isArray(ownedAssets)) return [];
  return ownedAssets.filter(assetRowContributesToNetWorth);
}

export function sumOwnedAssetPurchasePrices(ownedAssets) {
  if (!Array.isArray(ownedAssets)) return 0;
  return ownedAssets.reduce((sum, row) => {
    if (!assetRowContributesToNetWorth(row)) return sum;
    const n = Number(row?.purchasePrice);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
}

/** Quick sell: Pokémon cards at 100% face value; other sellables at 80%. */
export function computeAssetQuickSellPayout(row) {
  if (!row) return 0;
  if (row.kind === "pokemon") {
    const n = Number(row.purchasePrice);
    return Number.isFinite(n) ? Math.floor(n) : 0;
  }
  return computeQuickSellPayout(row.purchasePrice);
}

export function assetRowAllowsQuickSell(row) {
  if (!row || typeof row !== "object") return false;
  if (row.kind === "pokemon") return true;
  const def = SHOP.find((s) => s.id === row.shopItemId);
  return shopItemAllowsQuickSell(def);
}

/** Outcome when opening a Pokémon Pack from the shop (not an inventory row). */
export function rollPokemonPackPull() {
  const r = Math.random();
  if (r < 0.7) {
    return {
      shopItemId: "pokemon-card-common",
      name: "Pokémon Card (Common)",
      value: 1,
    };
  }
  if (r < 0.9) {
    return {
      shopItemId: "pokemon-card-rare",
      name: "Pokémon Card (Rare)",
      value: 20,
    };
  }
  return {
    shopItemId: "pokemon-card-holo",
    name: "Pokémon Card (Holo Rare ✨)",
    value: 1000,
  };
}

/** Cash on hand plus 100% of recorded asset purchase prices (not quick-sell value). */
export function computeNetWorth(cash, ownedAssets) {
  const m = Math.round(Number(cash));
  const safe = Number.isFinite(m) ? m : 0;
  return safe + sumOwnedAssetPurchasePrices(ownedAssets);
}

/** Quick sell pays 80% of original purchase price, floored. */
export function computeQuickSellPayout(purchasePrice) {
  return Math.floor(Number(purchasePrice) * 0.8);
}

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
    effect: { happiness: 7, health: 4 },
  },
  {
    id: "professor-cancelled-class",
    title: "Professor cancelled class",
    description:
      "Email hits at 8:02. The rest of the day opens up like a gift you did not earn.",
    effect: { happiness: 6, gpa: 2 },
  },
  {
    id: "professor-downward-dog",
    title: "Ran into your professor at Downward Dog",
    description:
      "Yoga mats and small talk about the syllabus. Weirdly human; weirdly good for your grade energy.",
    effect: { gpa: 4, social: 4 },
  },
  {
    id: "beaver-classic-game-day",
    title: "Beaver Classic game day",
    description:
      "Orange in the streets, noise in the stadium, homework deferred without guilt.",
    effect: { social: 11, happiness: 7, gpa: -3 },
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
    effect: { social: 8, happiness: 4 },
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
    effect: { social: 14, happiness: 7 },
    isMandatory: true,
  },
  "1-4": {
    title: "First Midterms",
    description:
      "First real exams land. If you were already drowning, the curve does not save you — if you were steady, you rise.",
    effect: (stats) => {
      const gpa = Number(stats?.gpa) || 0;
      return gpa < 60 ? { gpa: -8 } : { gpa: 4 };
    },
    isMandatory: true,
  },
  "1-8": {
    title: "Fall Finals",
    description:
      "Dead week is a lie and Reser is a dream. Either you cram through the wall or you close strong.",
    effect: (stats) => {
      const gpa = Number(stats?.gpa) || 0;
      return gpa < 50 ? { gpa: -10 } : { gpa: 6 };
    },
    isMandatory: true,
  },
  "2-3": {
    title: "Beaver Classic Football Weekend",
    description:
      "Tailgates, chants, and zero regret until Monday. Homework can wait; the Beavers cannot.",
    effect: { social: 11, happiness: 8, gpa: -5 },
    isMandatory: false,
  },
  "3-4": {
    title: "Junior Internship Fair at MU",
    description:
      "Resume paper, free pens, and recruiters who actually read your major. The career path gets real.",
    effect: { gpa: 4, social: 6 },
    isMandatory: false,
  },
  "4-1": {
    title: "Senior Week Kickoff",
    description:
      "Caps ordered, cameras out, and every goodbye starts with “we should hang this summer.”",
    effect: { happiness: 11, social: 7 },
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
