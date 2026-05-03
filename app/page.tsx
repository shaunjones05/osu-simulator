"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ACTIVITIES,
  WEEKS_PER_YEAR,
  INITIAL_STATS,
  ENERGY_BY_YEAR,
  JOBS,
  SHOP,
  getSpecialEvent,
  getRandEvent,
  getBlazersBetResult,
  rollFakeIdArrest,
  jobIsAvailable,
  shopItemPassesAgeGate,
  FIRST_PARTY_COKE_SCENARIO,
  FIRST_PARTY_COKE_SCENARIO_ID,
  KALSHI_STREAKER_SCENARIO,
  KALSHI_STREAKER_SCENARIO_ID,
  shopItemStacksOnPurchase,
  playerOwnsAnyFakeIdAsset,
  computeNetWorth,
  computeAssetQuickSellPayout,
  filterAssetsForDisplay,
  assetRowAllowsQuickSell,
  rollPokemonPackPull,
  SOULMATES,
} from "./lib/gameData.js";
import {
  applyWeek,
  applyPassiveEffects,
  checkGameOver,
  getEnding,
  resolveFirstPartyCokeChoice,
  rollJobApplicationAccepted,
  cryptoWeeklyMoneyDelta,
  rollGamblingMultiplier,
  gamblingNetMoneyDelta,
} from "./lib/gameLogic.js";
import { generateCutscene, generateCustomEnding } from "./lib/aiCutscene.js";
import { getScenarioForWeek } from "./lib/scenarios.js";
import StartScreen from "./components/StartScreen";
import StatBars from "./components/StatBars";
import ActivityPicker from "./components/ActivityPicker";
import ScenarioPopup, {
  type ScenarioForPopup,
  type ScenarioConsequence,
} from "./components/ScenarioPopup";
import CutsceneScreen, {
  type CutsceneExtraEvent,
} from "./components/CutsceneScreen";
import type { WeekStats } from "./components/WeekSummary";
import GameOver from "./components/GameOver";
import GraduationScreen, {
  type GraduationEnding,
} from "./components/GraduationScreen";
import {
  getSoundMuted,
  setSoundMuted,
  playConfirm,
  playGameOver,
  playStatDeltaFromStats,
} from "./lib/sounds.js";
import YearTransitionScreen from "./components/YearTransitionScreen";

type GamePhase =
  | "picking"
  | "cutscene"
  | "scenario"
  | "gameover"
  | "graduation"
  | "yearTransition";

const YEAR_TRANSITION_COPY: Record<
  2 | 3 | 4,
  { title: string; flavorLine: string }
> = {
  2: {
    title: "Sophomore Year Begins",
    flavorLine: "You know your way around now.",
  },
  3: {
    title: "Junior Year Begins",
    flavorLine: "Junior year. The hardest one.",
  },
  4: {
    title: "Senior Year Begins",
    flavorLine: "Final year. Make it count.",
  },
};

type FakeIdRisk = "none" | "high" | "low";

type ActivePerk = {
  shopItemId: string;
  weeklyBonus: Record<string, number> | null;
};

type OwnedAssetEntry = {
  instanceId: string;
  shopItemId: string;
  name: string;
  purchasePrice: number;
  kind?: "pokemon";
};

/** Narrow shop row (inferred `typeof SHOP` from JS can widen `id` oddly). */
type ShopPurchaseRow = {
  id: string;
  name: string;
  description: string;
  cost: number;
  effect: Record<string, number>;
  isOneTime: boolean;
  weeklyBonus: Record<string, number> | null;
  category?: string;
  isConsumable?: boolean;
  isFakeId?: boolean;
  fakeidRisk?: FakeIdRisk;
  minLegalPurchaseYear?: number;
};

/** Minimum font size (px) for Shop / Assets / Summary / Career panel bodies. */
const PANEL_FS = 16;
const PANEL_H2 = 18;

const POKEMON_PACK_ID = "pokemon-pack";
const LOOKMAXXING_SHOP_ID = "lookmaxxing";

type WeekHistoryEventSnippet = { title: string; description: string };

type WeekHistoryEntry = {
  year: number;
  week: number;
  activitiesChosen: { name: string; location: string }[];
  jobWorked: string | null;
  moneyEarned: number;
  moneySpent: number;
  shopItemsBought: string[];
  randomEvent: WeekHistoryEventSnippet | null;
  specialEvent: WeekHistoryEventSnippet | null;
  statsBefore: WeekStats;
  statsAfter: WeekStats;
};

function clampMoney(n: number): number {
  const x = Math.round(Number(n));
  if (Number.isNaN(x)) return 0;
  return Math.max(0, x);
}

function moneyDeltaFromConsequence(raw: Record<string, unknown>): number {
  const m = raw.money;
  if (typeof m !== "number" || !Number.isFinite(m)) return 0;
  return Math.round(m);
}

const STAT_KEYS = [
  "gpa",
  "health",
  "happiness",
  "social",
  "attractiveness",
] as const;

function formatStatDelta(delta: Record<string, number> | null | undefined) {
  if (!delta) return "—";
  const parts: string[] = [];
  for (const k of STAT_KEYS) {
    const v = delta[k];
    if (typeof v === "number" && v !== 0) {
      parts.push(`${k} ${v > 0 ? "+" : ""}${v}`);
    }
  }
  return parts.length ? parts.join(" · ") : "—";
}

/** Fixed max EP per week (matches ENERGY_BY_YEAR in v2). */
const WEEKLY_EP_MAX = 5;

const ACTIVITY_SHORT_LABEL: Record<string, string> = {
  "study-valley-library": "Study",
  "class-cordley-hall": "Class",
  "gym-dixon-rec": "Gym",
  "frat-party-26th": "Party",
  "football-reser": "Football",
  "eat-arnold-dining": "Dining",
  "sleep-in": "Sleep",
  "club-mu": "Club",
  "study-group-kelley": "Study group",
  gambling: "Gamble",
  "find-soulmate": "Soulmate",
};

function activityShortLabel(activityId: string): string {
  if (ACTIVITY_SHORT_LABEL[activityId]) return ACTIVITY_SHORT_LABEL[activityId];
  const a = ACTIVITIES.find((ac) => ac.id === activityId);
  if (!a) return activityId;
  return a.name.split(/\s+/)[0] ?? activityId;
}

function formatActivitiesSummaryLine(selections: string[]): string {
  const counts = new Map<string, number>();
  for (const id of selections) {
    const short = activityShortLabel(id);
    counts.set(short, (counts.get(short) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, n]) => (n > 1 ? `${label} x${n}` : label))
    .join(", ");
}

const STAT_LABEL_EN: Record<(typeof STAT_KEYS)[number], string> = {
  gpa: "GPA",
  health: "Health",
  happiness: "Happiness",
  social: "Social",
  attractiveness: "Looks",
};

function formatShopToastStatLine(effect: Record<string, number>): string {
  const parts: string[] = [];
  for (const k of STAT_KEYS) {
    const v = effect[k];
    if (typeof v === "number" && v !== 0) {
      parts.push(`${v > 0 ? "+" : ""}${v} ${STAT_LABEL_EN[k]}`);
    }
  }
  return parts.join(", ");
}

function formatStatChangeLine(before: WeekStats, after: WeekStats): string {
  const parts: string[] = [];
  for (const k of STAT_KEYS) {
    const d = (after[k] ?? 0) - (before[k] ?? 0);
    if (d !== 0) {
      parts.push(
        `${d > 0 ? "+" : ""}${d} ${STAT_LABEL_EN[k]}`,
      );
    }
  }
  return parts.join("  ") || "—";
}

function yearStoryHeading(year: number): string {
  const tier =
    year === 1
      ? "Freshman"
      : year === 2
        ? "Sophomore"
        : year === 3
          ? "Junior"
          : "Senior";
  return `Year ${year} — ${tier}`;
}

function historyActivitiesSummaryLine(
  chosen: { name: string; location: string }[],
): string {
  const ids = chosen.map((c) => {
    const a = ACTIVITIES.find(
      (ac) => ac.name === c.name && ac.location === c.location,
    );
    return a?.id ?? c.name;
  });
  return formatActivitiesSummaryLine(ids);
}

function historyEventTitlesLine(entry: WeekHistoryEntry): string | null {
  const parts: string[] = [];
  if (entry.specialEvent?.title) parts.push(entry.specialEvent.title);
  if (entry.randomEvent?.title) parts.push(entry.randomEvent.title);
  if (parts.length === 0) return null;
  return parts.join(" · ");
}

function scenarioUsedId(scenario: { id: string }, year: number): string {
  if (scenario.id === "halloween_party") return `halloween_party:${year}`;
  return scenario.id;
}

function deltaFromConsequence(
  con: Record<string, unknown>,
): Record<string, number | undefined> {
  const d: Record<string, number | undefined> = {};
  for (const k of STAT_KEYS) {
    const v = con[k];
    if (v === undefined || v === null) continue;
    const n = Number(v);
    if (!Number.isFinite(n)) continue;
    d[k] = n;
  }
  return d;
}

function clampStat(value: number): number {
  const n = Number(value);
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function normalizeWeekStats(
  s: Record<string, number | undefined>,
): WeekStats {
  return {
    gpa: clampStat(Math.round(Number(s.gpa) || 0)),
    health: clampStat(Math.round(Number(s.health) || 0)),
    happiness: clampStat(Math.round(Number(s.happiness) || 0)),
    social: clampStat(Math.round(Number(s.social) || 0)),
    attractiveness: clampStat(
      Math.round(Number(s.attractiveness) || 0),
    ),
  };
}

function applyStatDelta(
  stats: WeekStats,
  delta: Record<string, number | undefined>,
): WeekStats {
  const next = { ...stats };
  for (const k of STAT_KEYS) {
    if (delta[k] !== undefined && delta[k] !== null) {
      next[k] = clampStat(
        Math.round((Number(next[k]) || 0) + (Number(delta[k]) || 0)),
      );
    }
  }
  return next;
}

/** Filename under `/public/scenes/` from `ACTIVITIES[].sceneImage` (e.g. `library.png`). */
function pickSceneImageFromSelections(weekSelections: string[]): string {
  if (weekSelections.length === 0) return "";
  const seen = new Set<string>();
  const order: string[] = [];
  for (const id of weekSelections) {
    if (!seen.has(id)) {
      seen.add(id);
      order.push(id);
    }
  }
  let bestId = weekSelections[0] ?? "";
  let bestEp = -1;
  for (const id of order) {
    const totalEp = weekSelections.reduce((sum, pick) => {
      if (pick !== id) return sum;
      const a = ACTIVITIES.find((ac) => ac.id === pick);
      return sum + (a?.epCost ?? 0);
    }, 0);
    if (totalEp > bestEp) {
      bestEp = totalEp;
      bestId = id;
    }
  }
  const activity = ACTIVITIES.find((ac) => ac.id === bestId);
  return activity?.sceneImage ?? "";
}

function SoundMuteHudButton({
  muted,
  onToggle,
}: {
  muted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={muted}
      aria-label={muted ? "Unmute game sounds" : "Mute game sounds"}
      className="osu-display-font osu-display-font--micro"
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        border: "2px solid rgba(255,255,255,0.25)",
        background: "rgba(26, 26, 26, 0.92)",
        color: "#FFFFFF",
        fontSize: "1.1rem",
        cursor: "pointer",
        lineHeight: 1,
        padding: 0,
        flexShrink: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [playerMajor, setPlayerMajor] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [currentYear, setCurrentYear] = useState(1);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [stats, setStats] = useState<WeekStats>(() => ({ ...INITIAL_STATS }));
  const [week1BaselineStats, setWeek1BaselineStats] = useState<WeekStats>(() => ({
    ...INITIAL_STATS,
  }));
  const [energyRemaining, setEnergyRemaining] = useState(
    ENERGY_BY_YEAR.year1,
  );
  const [weekSelections, setWeekSelections] = useState<string[]>([]);
  const [gamePhase, setGamePhase] = useState<GamePhase>("picking");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [sceneImageFilename, setSceneImageFilename] = useState("");
  const [cutsceneExtraEvent, setCutsceneExtraEvent] =
    useState<CutsceneExtraEvent | null>(null);
  const [cutsceneStatsBefore, setCutsceneStatsBefore] =
    useState<WeekStats | null>(null);
  const [cutsceneStatsAfter, setCutsceneStatsAfter] =
    useState<WeekStats | null>(null);
  const [gameOverReason, setGameOverReason] = useState("");
  const [finalEnding, setFinalEnding] = useState<GraduationEnding | null>(null);
  const [aiEndingText, setAiEndingText] = useState("");
  const [activitiesPanelOpen, setActivitiesPanelOpen] = useState(false);
  const [careerPanelOpen, setCareerPanelOpen] = useState(false);
  const [shopPanelOpen, setShopPanelOpen] = useState(false);
  const [assetsPanelOpen, setAssetsPanelOpen] = useState(false);
  const [money, setMoney] = useState(500);
  const [currentSoulmate, setCurrentSoulmate] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDateAvailable, setIsDateAvailable] = useState(true);
  const [fakeidRisk, setFakeidRisk] = useState<FakeIdRisk>("none");
  const [fakeIdConfirmItemId, setFakeIdConfirmItemId] = useState<string | null>(
    null,
  );
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [ownedShopIds, setOwnedShopIds] = useState<string[]>([]);
  const [ownedAssets, setOwnedAssets] = useState<OwnedAssetEntry[]>([]);
  const [activePerks, setActivePerks] = useState<ActivePerk[]>([]);
  const [usedScenarioIds, setUsedScenarioIds] = useState<string[]>([]);
  const [pendingApiScenario, setPendingApiScenario] =
    useState<ScenarioForPopup | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioForPopup | null>(
    null,
  );
  const [firstPartyDone, setFirstPartyDone] = useState(false);
  const [kalshiStreakerDone, setKalshiStreakerDone] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [jobResultModal, setJobResultModal] = useState<{
    accepted: boolean;
    jobId: string;
    jobName: string;
    epCost: number;
    weeklyPay: number;
  } | null>(null);
  const [cryptoJobApplyId, setCryptoJobApplyId] = useState<string | null>(null);
  const [gamblingModalOpen, setGamblingModalOpen] = useState(false);
  const [gamblingBetAmount, setGamblingBetAmount] = useState<number | null>(null);
  const [gamblingMoneyNet, setGamblingMoneyNet] = useState<number | null>(null);
  const [gamblingBetInput, setGamblingBetInput] = useState("");
  const [gamblingResultModal, setGamblingResultModal] = useState<string | null>(
    null,
  );
  const [jobNoPayModal, setJobNoPayModal] = useState(false);
  const [cryptoFiredModal, setCryptoFiredModal] = useState(false);
  const kalshiRollStartedRef = useRef(false);
  const pendingKalshiChoiceRef = useRef<number | null>(null);
  const pendingJobIdRef = useRef<string | null>(null);
  const [weekHistory, setWeekHistory] = useState<WeekHistoryEntry[]>([]);
  const [weeklyPurchases, setWeeklyPurchases] = useState<string[]>([]);
  const [weeklyShopSpend, setWeeklyShopSpend] = useState(0);
  const [summaryPanelOpen, setSummaryPanelOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });
  const toastDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const toastRemoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (toastDismissTimerRef.current) {
        clearTimeout(toastDismissTimerRef.current);
        toastDismissTimerRef.current = null;
      }
      if (toastRemoveTimerRef.current) {
        clearTimeout(toastRemoveTimerRef.current);
        toastRemoveTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    pendingJobIdRef.current = pendingJobId;
  }, [pendingJobId]);

  const [soundMutedUI, setSoundMutedUI] = useState(false);
  useEffect(() => {
    setSoundMutedUI(getSoundMuted());
  }, []);

  function toggleSoundMute() {
    const next = !getSoundMuted();
    setSoundMuted(next);
    setSoundMutedUI(next);
  }

  if (!gameStarted) {
    return (
      <StartScreen
        onStart={(name, major) => {
          setPlayerName(name);
          setPlayerMajor(major);
          setCurrentSoulmate(null);
          setIsDateAvailable(true);
          setCurrentYear(1);
          setCurrentWeek(1);
          const baseline = { ...INITIAL_STATS };
          setStats(baseline);
          setWeek1BaselineStats(baseline);
          setEnergyRemaining(ENERGY_BY_YEAR.year1);
          setWeekSelections([]);
          setGamePhase("picking");
          setIsGeneratingStory(false);
          setStoryText("");
          setSceneImageFilename("");
          setCutsceneExtraEvent(null);
          setCutsceneStatsBefore(null);
          setCutsceneStatsAfter(null);
          setGameOverReason("");
          setFinalEnding(null);
          setAiEndingText("");
          setActivitiesPanelOpen(false);
          setCareerPanelOpen(false);
          setShopPanelOpen(false);
          setAssetsPanelOpen(false);
          setMoney(500);
          setFakeidRisk("none");
          setFakeIdConfirmItemId(null);
          setActiveJobId(null);
          setOwnedShopIds([]);
          setOwnedAssets([]);
          setActivePerks([]);
          setUsedScenarioIds([]);
          setPendingApiScenario(null);
          setActiveScenario(null);
          setFirstPartyDone(false);
          setKalshiStreakerDone(false);
          setPendingJobId(null);
          setJobResultModal(null);
          setCryptoJobApplyId(null);
          setGamblingModalOpen(false);
          setGamblingBetAmount(null);
          setGamblingMoneyNet(null);
          setGamblingBetInput("");
          setGamblingResultModal(null);
          setJobNoPayModal(false);
          setCryptoFiredModal(false);
          kalshiRollStartedRef.current = false;
          pendingKalshiChoiceRef.current = null;
          setWeekHistory([]);
          setWeeklyPurchases([]);
          setWeeklyShopSpend(0);
          setSummaryPanelOpen(false);
          if (toastDismissTimerRef.current) {
            clearTimeout(toastDismissTimerRef.current);
            toastDismissTimerRef.current = null;
          }
          if (toastRemoveTimerRef.current) {
            clearTimeout(toastRemoveTimerRef.current);
            toastRemoveTimerRef.current = null;
          }
          setToast({ message: "", visible: false });
          setGameStarted(true);
        }}
      />
    );
  }

  if (gamePhase === "gameover") {
    return (
      <>
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 100,
          }}
        >
          <SoundMuteHudButton muted={soundMutedUI} onToggle={toggleSoundMute} />
        </div>
        <GameOver
          reason={gameOverReason}
          week={currentWeek}
          year={currentYear}
          finalStats={stats}
          onRestart={() => {
            setGameStarted(false);
          }}
        />
      </>
    );
  }

  if (gamePhase === "graduation") {
    return (
      <>
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 100,
          }}
        >
          <SoundMuteHudButton muted={soundMutedUI} onToggle={toggleSoundMute} />
        </div>
        <GraduationScreen
          playerName={playerName}
          ending={finalEnding}
          aiEndingText={aiEndingText}
          finalStats={stats}
          onRestart={() => {
            setGameStarted(false);
          }}
        />
      </>
    );
  }

  async function resolveWeekEnd(
    statsBefore: WeekStats,
    selections: string[],
    year: number,
    week: number,
    baseline: WeekStats,
    name: string,
    playerMajor: string,
    scenarioIdsForApi: string[],
    moneyBefore: number,
    activeJobIdAtStart: string | null,
    activePerksSnapshot: ActivePerk[],
    fakeidRiskAtStart: FakeIdRisk,
    hadSoulmateAtWeekStart: boolean,
    resolutionOpts?: {
      jobHadEnoughEp?: boolean;
      gamblingBet?: number;
      gamblingMoneyNet?: number | null;
      /** 0 = take the bet, 1 = hard pass; applied once in this resolve. */
      kalshiChoice?: number | null;
    },
  ) {
    let s: WeekStats = normalizeWeekStats(
      applyWeek(statsBefore, selections, ACTIVITIES),
    );
    s = normalizeWeekStats(
      applyPassiveEffects(s, {
        activePerks: activePerksSnapshot,
        hasSoulmate: hadSoulmateAtWeekStart,
      }),
    );

    const special = getSpecialEvent(year, week);
    let specialEventHist: WeekHistoryEventSnippet | null = null;
    if (special) {
      specialEventHist = {
        title: special.title,
        description: special.description,
      };
      const rawEffect =
        typeof special.effect === "function"
          ? special.effect(s)
          : special.effect;
      s = normalizeWeekStats(applyStatDelta(s, rawEffect));
    }

    let extra: CutsceneExtraEvent | null = null;
    let randomEventHist: WeekHistoryEventSnippet | null = null;
    const rand = getRandEvent();
    if (rand) {
      if ("isBet" in rand && rand.isBet) {
        const bet = getBlazersBetResult();
        extra = {
          title: rand.title,
          description: `${rand.description}\n\n${bet.message}`,
        };
        randomEventHist = {
          title: rand.title,
          description: `${rand.description}\n\n${bet.message}`,
        };
        s = normalizeWeekStats(applyStatDelta(s, bet.effect));
      } else {
        extra = { title: rand.title, description: rand.description };
        randomEventHist = {
          title: rand.title,
          description: rand.description,
        };
        s = normalizeWeekStats(applyStatDelta(s, rand.effect));
      }
    }

    let moneyNetChange = 0;

    const kc = resolutionOpts?.kalshiChoice;
    if (kc === 0) {
      s = normalizeWeekStats(
        applyStatDelta(s, { happiness: -10, social: 20 }),
      );
      moneyNetChange += 14000;
    } else if (kc === 1) {
      s = normalizeWeekStats(applyStatDelta(s, { happiness: 2 }));
    }

    const gamblingBet = Math.max(
      0,
      Math.round(Number(resolutionOpts?.gamblingBet) || 0),
    );
    if (gamblingBet > 0) {
      const preset = resolutionOpts?.gamblingMoneyNet;
      const net =
        typeof preset === "number" && Number.isFinite(preset)
          ? preset
          : gamblingNetMoneyDelta(
              gamblingBet,
              rollGamblingMultiplier(),
            );
      moneyNetChange += net;
    }

    const arrest = rollFakeIdArrest(
      fakeidRiskAtStart === "high" || fakeidRiskAtStart === "low"
        ? fakeidRiskAtStart
        : "none",
    );
    if (arrest) {
      s = normalizeWeekStats(applyStatDelta(s, arrest.effect));
      moneyNetChange += arrest.moneyDelta;
      const arrestExtra: CutsceneExtraEvent = {
        title: arrest.title,
        description: arrest.description,
      };
      const arrestHist: WeekHistoryEventSnippet = {
        title: arrest.title,
        description: arrest.description,
      };
      if (randomEventHist) {
        randomEventHist = {
          title: "This week at OSU",
          description: `${randomEventHist.title}: ${randomEventHist.description}\n\n— ${arrestHist.title}: ${arrestHist.description}`,
        };
      } else {
        randomEventHist = arrestHist;
      }
      if (extra) {
        extra = {
          title: "This week at OSU",
          description: `${extra.title}: ${extra.description}\n\n— ${arrestExtra.title}: ${arrestExtra.description}`,
        };
      } else {
        extra = arrestExtra;
      }
    }

    const job = activeJobIdAtStart
      ? JOBS.find((j) => j.id === activeJobIdAtStart)
      : null;
    let jobNoPay = false;
    let cryptoFired = false;
    const jobOk =
      resolutionOpts?.jobHadEnoughEp !== false || Boolean(job?.isCrypto);

    if (job) {
      if (job.isCrypto) {
        const baseMoney = moneyBefore + moneyNetChange;
        const cdelta = cryptoWeeklyMoneyDelta(baseMoney);
        moneyNetChange += cdelta;
        if (clampMoney(moneyBefore + moneyNetChange) <= 0) {
          cryptoFired = true;
        }
      } else if (!jobOk) {
        jobNoPay = true;
      } else {
        moneyNetChange += job.weeklyPay ?? 0;
      }
    }

    const finalStats = normalizeWeekStats(s);
    const sceneFile = pickSceneImageFromSelections(selections);

    const jobLine = job
      ? job.isCrypto
        ? `${job.name} at ${job.location} (crypto — ${job.epCost} EP/week, volatile)`
        : `${job.name} at ${job.location} ($${job.weeklyPay}/week, ${job.epCost} EP/week)`
      : "no part-time job";
    const moneyForNarrative = clampMoney(moneyBefore + moneyNetChange);

    let story = "";
    let apiScenario: ScenarioForPopup | null = null;
    try {
      const res = await fetch("/api/cutscene", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerName: name,
          playerMajor,
          year,
          week,
          chosenActivities: selections,
          finalStats,
          baseline,
          usedScenarioIds: scenarioIdsForApi,
          moneyForNarrative,
          jobLine,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          storyText?: string;
          apiScenario?: ScenarioForPopup | null;
        };
        story = data.storyText ?? "";
        apiScenario = data.apiScenario ?? null;
      } else {
        throw new Error("cutscene api");
      }
    } catch {
      story = await generateCutscene(
        name,
        year,
        week,
        selections,
        finalStats,
        baseline,
        moneyForNarrative,
        jobLine,
        playerMajor,
      );
      apiScenario = null;
    }

    return {
      finalStats,
      story,
      sceneFile,
      extra,
      apiScenario,
      moneyNetChange,
      specialEventHist,
      randomEventHist,
      jobNoPay,
      cryptoFired,
    };
  }

  function showCareerToast(message: string) {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 2800);
  }

  function handleJobApplyClick(jobId: string) {
    if (activeJobId && activeJobId !== jobId) {
      showCareerToast("Quit your current job first.");
      return;
    }
    if (pendingJobId) {
      showCareerToast("You already have a pending application.");
      return;
    }
    const job = JOBS.find((j) => j.id === jobId);
    if (!job) return;
    if (job.isCrypto) {
      setCryptoJobApplyId(jobId);
      return;
    }
    const minG = job.minGpa != null ? Number(job.minGpa) : 0;
    if ((stats.gpa ?? 0) < minG) {
      showCareerToast(
        "You don't meet the GPA requirement for this job.",
      );
      return;
    }
    setPendingJobId(jobId);
    showCareerToast(
      "Application submitted. You'll hear back next week.",
    );
  }

  function confirmCryptoJobApply() {
    if (!cryptoJobApplyId) return;
    setPendingJobId(cryptoJobApplyId);
    setCryptoJobApplyId(null);
    showCareerToast(
      "Application submitted. You'll hear back next week.",
    );
  }

  function handleGamblingBetSubmit() {
    const n = Number(gamblingBetInput);
    if (!Number.isFinite(n) || n <= 0) {
      showCareerToast("Enter a valid positive dollar amount.");
      return;
    }
    const bet = Math.floor(n);
    if (bet > money) {
      showCareerToast("You can't bet more than you have.");
      return;
    }
      setGamblingBetAmount(bet);
      const mult = rollGamblingMultiplier();
      const net = gamblingNetMoneyDelta(bet, mult);
      setGamblingMoneyNet(net);
      const end = bet + net;
    setGamblingResultModal(
      net >= 0
        ? `You walked away with $${end}.`
        : `You lost $${Math.abs(net)}.`,
    );
    setGamblingModalOpen(false);
  }

  function acknowledgeGamblingResult() {
    setGamblingResultModal(null);
    handleActivityConfirm();
  }

  function handleActivityConfirm() {
    const spentEpConfirm = weekSelections.reduce((sum, id) => {
      const a = ACTIVITIES.find((ac) => ac.id === id);
      return sum + (a?.epCost ?? 0);
    }, 0);
    if (spentEpConfirm < 1) return;

    const selections = [...weekSelections];

    if (!firstPartyDone && selections.includes("frat-party-26th")) {
      setActiveScenario(FIRST_PARTY_COKE_SCENARIO);
      setGamePhase("scenario");
      return;
    }

    if (selections.includes("gambling") && gamblingBetAmount === null) {
      setGamblingModalOpen(true);
      return;
    }

    if (!kalshiStreakerDone && selections.includes("football-reser")) {
      if (!kalshiRollStartedRef.current) {
        kalshiRollStartedRef.current = true;
        if (Math.random() < 0.5) {
          setActiveScenario(KALSHI_STREAKER_SCENARIO);
          setGamePhase("scenario");
          return;
        }
      }
    }

    const job = activeJobId
      ? JOBS.find((j) => j.id === activeJobId)
      : null;
    const jobEp = job?.epCost ?? 0;
    const jobHadEnoughEp = jobEp === 0 || energyRemaining >= jobEp;

    kalshiRollStartedRef.current = false;

    const statsBefore: WeekStats = { ...stats };
    const hadSoulmateAtWeekStart = currentSoulmate !== null;
    const hadPartnerAtWeekStart = hadSoulmateAtWeekStart;
    const dateSlotOpen = isDateAvailable;
    const year = currentYear;
    const week = currentWeek;
    const baseline = { ...week1BaselineStats };
    const name = playerName;
    const major = playerMajor;
    const moneySnap = money;
    const jobSnap = activeJobId;
    const perksSnap = [...activePerks];
    const riskSnap = fakeidRisk;
    const weeklyPurchasesSnap = [...weeklyPurchases];
    const weeklyShopSpendSnap = weeklyShopSpend;
    const kalshiChoiceSnap = pendingKalshiChoiceRef.current;
    pendingKalshiChoiceRef.current = null;

    playConfirm();
    setIsGeneratingStory(true);
    setActivitiesPanelOpen(false);
    setCareerPanelOpen(false);
    setShopPanelOpen(false);
    setAssetsPanelOpen(false);
    setSummaryPanelOpen(false);
    setPendingApiScenario(null);

    void (async () => {
      const {
        finalStats,
        story,
        sceneFile,
        extra,
        apiScenario,
        moneyNetChange,
        specialEventHist,
        randomEventHist,
        jobNoPay,
        cryptoFired,
      } = await resolveWeekEnd(
        statsBefore,
        selections,
        year,
        week,
        baseline,
        name,
        major,
        usedScenarioIds,
        moneySnap,
        jobSnap,
        perksSnap,
        riskSnap,
        hadSoulmateAtWeekStart,
        {
          jobHadEnoughEp,
          gamblingBet: gamblingBetAmount ?? 0,
          gamblingMoneyNet: gamblingMoneyNet,
          kalshiChoice: kalshiChoiceSnap,
        },
      );

      if (
        selections.includes("find-soulmate") &&
        !hadPartnerAtWeekStart &&
        dateSlotOpen &&
        SOULMATES.length > 0
      ) {
        const pick =
          SOULMATES[Math.floor(Math.random() * SOULMATES.length)];
        if (pick) {
          setCurrentSoulmate(pick);
          setIsDateAvailable(false);
          showHudToast(
            `💕 You matched with ${pick.name}! You are now dating.`,
          );
        }
      }

      setGamblingBetAmount(null);
      setGamblingMoneyNet(null);
      setGamblingBetInput("");

      const activitiesChosen = selections.map((id) => {
        const a = ACTIVITIES.find((ac) => ac.id === id);
        return {
          name: a?.name ?? id,
          location: a?.location ?? "",
        };
      });
      const jobObj = jobSnap ? JOBS.find((j) => j.id === jobSnap) : null;
      const weekEntry: WeekHistoryEntry = {
        year,
        week,
        activitiesChosen,
        jobWorked: jobObj?.name ?? null,
        moneyEarned: jobNoPay ? 0 : (jobObj?.weeklyPay ?? 0),
        moneySpent: weeklyShopSpendSnap,
        shopItemsBought: [...weeklyPurchasesSnap],
        randomEvent: randomEventHist,
        specialEvent: specialEventHist,
        statsBefore,
        statsAfter: finalStats,
      };
      setWeekHistory((h) => [...h, weekEntry]);

      setPendingApiScenario(apiScenario);
      setStoryText(story);
      setSceneImageFilename(sceneFile);
      setCutsceneExtraEvent(extra);
      setCutsceneStatsBefore(statsBefore);
      setCutsceneStatsAfter(finalStats);
      setStats(finalStats);
      setMoney((m) => clampMoney(m + moneyNetChange));
      setIsGeneratingStory(false);

      if (jobNoPay) setJobNoPayModal(true);
      if (cryptoFired) {
        setCryptoFiredModal(true);
        setActiveJobId(null);
      }

      playStatDeltaFromStats(statsBefore, finalStats);
      const over = checkGameOver(finalStats);
      if (over.isOver) {
        playGameOver();
        setGameOverReason(over.reason);
        setGamePhase("gameover");
      } else {
        setGamePhase("cutscene");
      }
    })();
  }

  async function advanceAfterWeekResolved(latestStats: WeekStats) {
    const pj = pendingJobIdRef.current;
    if (pj) {
      pendingJobIdRef.current = null;
      setPendingJobId(null);
      const accepted = rollJobApplicationAccepted();
      const j = JOBS.find((x) => x.id === pj);
      if (accepted && j) {
        setActiveJobId(j.id);
      }
      if (j) {
        setJobResultModal({
          accepted,
          jobId: pj,
          jobName: j.name,
          epCost: j.epCost,
          weeklyPay: j.weeklyPay,
        });
      }
    }

    if (currentWeek < WEEKS_PER_YEAR) {
      setCurrentWeek((w) => w + 1);
      setWeekSelections([]);
      setActivitiesPanelOpen(false);
      setCareerPanelOpen(false);
      setShopPanelOpen(false);
      setAssetsPanelOpen(false);
      setSummaryPanelOpen(false);
      setWeeklyPurchases([]);
      setWeeklyShopSpend(0);
      setGamePhase("picking");
      setEnergyRemaining(WEEKLY_EP_MAX);
      return;
    }

    if (currentYear < 4) {
      const nextYear = currentYear + 1;
      setCurrentYear(nextYear);
      setCurrentWeek(1);
      setWeekSelections([]);
      setActivitiesPanelOpen(false);
      setCareerPanelOpen(false);
      setShopPanelOpen(false);
      setAssetsPanelOpen(false);
      setSummaryPanelOpen(false);
      setWeeklyPurchases([]);
      setWeeklyShopSpend(0);
      setGamePhase("yearTransition");
      setEnergyRemaining(WEEKLY_EP_MAX);
      return;
    }

    const ending = getEnding(latestStats);
    if (ending !== null) {
      setFinalEnding(ending);
      setAiEndingText("");
      setGamePhase("graduation");
      return;
    }

    setFinalEnding(null);
    const text = await generateCustomEnding(playerName, latestStats);
    setAiEndingText(text);
    setGamePhase("graduation");
  }

  async function handleCutsceneContinue() {
    if (pendingApiScenario) {
      setActiveScenario(pendingApiScenario);
      setPendingApiScenario(null);
      setGamePhase("scenario");
      return;
    }
    const guaranteed = getScenarioForWeek(
      currentYear,
      currentWeek,
      usedScenarioIds,
    );
    if (guaranteed) {
      setActiveScenario(guaranteed as ScenarioForPopup);
      setGamePhase("scenario");
      return;
    }
    await advanceAfterWeekResolved(stats);
  }

  function handleScenarioComplete(
    choiceIndex: number,
    resolved?: ScenarioConsequence,
  ) {
    if (!activeScenario) return;

    if (activeScenario.id === FIRST_PARTY_COKE_SCENARIO_ID) {
      const r = resolved;
      if (!r) return;
      if (r.gameOver) {
        playGameOver();
        setGameOverReason(
          String(r.message ?? "You overdosed. Your college story ends here."),
        );
        setFirstPartyDone(true);
        setActiveScenario(null);
        setGamePhase("gameover");
        return;
      }
      const con = r as Record<string, unknown>;
      const delta = deltaFromConsequence(con);
      const nextStats = normalizeWeekStats(applyStatDelta(stats, delta));
      setStats(nextStats);
      const cashDelta = moneyDeltaFromConsequence(con);
      if (cashDelta !== 0) {
        setMoney((m) => clampMoney(m + cashDelta));
      }
      setFirstPartyDone(true);
      setActiveScenario(null);
      handleActivityConfirm();
      return;
    }

    if (activeScenario.id === KALSHI_STREAKER_SCENARIO_ID) {
      pendingKalshiChoiceRef.current = choiceIndex;
      setKalshiStreakerDone(true);
      setActiveScenario(null);
      handleActivityConfirm();
      return;
    }

    const raw =
      (resolved as Record<string, unknown> | undefined) ??
      (activeScenario.choices[choiceIndex]?.consequence as
        | Record<string, unknown>
        | undefined);
    if (!raw || typeof raw !== "object") return;
    const delta = deltaFromConsequence(raw);
    const nextStats = normalizeWeekStats(applyStatDelta(stats, delta));
    playStatDeltaFromStats(stats, nextStats);
    setStats(nextStats);
    const cashDelta = moneyDeltaFromConsequence(raw);
    if (cashDelta !== 0) {
      setMoney((m) => clampMoney(m + cashDelta));
    }
    setUsedScenarioIds((prev) => [
      ...prev,
      scenarioUsedId(activeScenario, currentYear),
    ]);
    setActiveScenario(null);
    const over = checkGameOver(nextStats);
    if (over.isOver) {
      playGameOver();
      setGameOverReason(over.reason);
      setGamePhase("gameover");
      return;
    }
    void advanceAfterWeekResolved(nextStats);
  }

  function openActivitiesPanel() {
    setCareerPanelOpen(false);
    setShopPanelOpen(false);
    setAssetsPanelOpen(false);
    setSummaryPanelOpen(false);
    setActivitiesPanelOpen(true);
  }

  function openCareerPanel() {
    setActivitiesPanelOpen(false);
    setShopPanelOpen(false);
    setAssetsPanelOpen(false);
    setSummaryPanelOpen(false);
    setCareerPanelOpen(true);
  }

  function openShopPanel() {
    setActivitiesPanelOpen(false);
    setCareerPanelOpen(false);
    setAssetsPanelOpen(false);
    setSummaryPanelOpen(false);
    setShopPanelOpen(true);
  }

  function openAssetsPanel() {
    setActivitiesPanelOpen(false);
    setCareerPanelOpen(false);
    setShopPanelOpen(false);
    setSummaryPanelOpen(false);
    setAssetsPanelOpen(true);
  }

  function openSummaryPanel() {
    setActivitiesPanelOpen(false);
    setCareerPanelOpen(false);
    setShopPanelOpen(false);
    setAssetsPanelOpen(false);
    setSummaryPanelOpen(true);
  }

  function showHudToast(fullMessage: string) {
    if (toastDismissTimerRef.current) {
      clearTimeout(toastDismissTimerRef.current);
      toastDismissTimerRef.current = null;
    }
    if (toastRemoveTimerRef.current) {
      clearTimeout(toastRemoveTimerRef.current);
      toastRemoveTimerRef.current = null;
    }

    setToast((prev) => {
      if (prev.visible && prev.message) {
        return { message: fullMessage, visible: true };
      }
      return { message: fullMessage, visible: false };
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setToast((t) =>
          t.message === fullMessage ? { ...t, visible: true } : t,
        );
      });
    });

    toastDismissTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
      toastDismissTimerRef.current = null;
      toastRemoveTimerRef.current = setTimeout(() => {
        setToast({ message: "", visible: false });
        toastRemoveTimerRef.current = null;
      }, 300);
    }, 2500);
  }

  function handleBreakUp() {
    if (!currentSoulmate) return;
    const nm = currentSoulmate.name;
    if (
      !window.confirm(`Are you sure you want to break up with ${nm}?`)
    ) {
      return;
    }
    setCurrentSoulmate(null);
    setIsDateAvailable(true);
    showHudToast(`💔 You and ${nm} have broken up.`);
  }

  function showShopPurchaseToast(item: (typeof SHOP)[number]) {
    const rawEffect = (item.effect ?? {}) as Record<string, number>;
    const statLine = formatShopToastStatLine(rawEffect);
    const fullMessage = statLine
      ? `Bought ${item.name}! ${statLine}`
      : `Bought ${item.name}!`;
    showHudToast(fullMessage);
  }

  function completeShopPurchase(raw: (typeof SHOP)[number]) {
    const item = raw as unknown as ShopPurchaseRow;
    if (item.id === POKEMON_PACK_ID) {
      setMoney((m) => clampMoney(m - item.cost));
      setWeeklyShopSpend((n) => n + item.cost);
      setWeeklyPurchases((prev) => [...prev, item.name]);
      setStats((st) => normalizeWeekStats(applyStatDelta(st, item.effect)));
      const pull = rollPokemonPackPull();
      const instanceId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `pokemon-card-${crypto.randomUUID()}`
          : `pokemon-card-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      setOwnedAssets((prev) => [
        ...prev,
        {
          instanceId,
          shopItemId: pull.shopItemId,
          name: pull.name,
          purchasePrice: pull.value,
          kind: "pokemon",
        },
      ]);
      showHudToast(
        `You pulled a ${pull.name}! Worth $${pull.value}.`,
      );
      return;
    }

    if (item.id === LOOKMAXXING_SHOP_ID) {
      setMoney((m) => clampMoney(m - item.cost));
      setWeeklyShopSpend((n) => n + item.cost);
      setWeeklyPurchases((prev) => [...prev, item.name]);
      const good = Math.random() < 0.6;
      setStats((st) => {
        const cur = Math.round(Number(st.attractiveness) || 0);
        const d = good ? 15 : -20;
        return normalizeWeekStats({
          ...st,
          attractiveness: clampStat(cur + d),
        });
      });
      showHudToast(
        good
          ? "Lookmaxxing paid off! +15 Looks 📈"
          : "You learned about bone smashing. Turns out fracturing your own bones just causes swelling, nerve damage, and permanent scarring. -20 Looks 💀",
      );
      return;
    }

    if (item.isConsumable !== true) {
      const instanceId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `a-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const row: OwnedAssetEntry = {
        instanceId,
        shopItemId: item.id,
        name: item.name,
        purchasePrice: item.cost,
      };
      setOwnedAssets((prev) => [...prev, row]);
    }
    setMoney((m) => clampMoney(m - item.cost));
    setWeeklyShopSpend((n) => n + item.cost);
    setWeeklyPurchases((prev) => [...prev, item.name]);
    setStats((st) => normalizeWeekStats(applyStatDelta(st, item.effect)));
    if (item.isFakeId && item.fakeidRisk) {
      setFakeidRisk(item.fakeidRisk);
    }
    if (!item.isOneTime && item.weeklyBonus) {
      setOwnedShopIds((prev) =>
        prev.includes(item.id) ? prev : [...prev, item.id],
      );
      const perk: ActivePerk = {
        shopItemId: item.id,
        weeklyBonus: item.weeklyBonus,
      };
      setActivePerks((prev) => [...prev, perk]);
    }
    showShopPurchaseToast(raw);
  }

  function buyShopItem(itemId: string) {
    const item = SHOP.find((i) => i.id === itemId);
    if (!item) return;
    if (money < item.cost) return;
    if (
      !shopItemStacksOnPurchase(item) &&
      !item.isOneTime &&
      ownedShopIds.includes(itemId)
    )
      return;
    if (!shopItemPassesAgeGate(item, currentYear, fakeidRisk)) return;
    if (item.isFakeId && playerOwnsAnyFakeIdAsset(ownedAssets)) return;

    if (item.isFakeId) {
      setFakeIdConfirmItemId(itemId);
      return;
    }

    completeShopPurchase(item);
  }

  function quickSellAsset(instanceId: string) {
    const row = ownedAssets.find((a) => a.instanceId === instanceId);
    if (!row || !assetRowAllowsQuickSell(row)) return;
    const item = SHOP.find((i) => i.id === row.shopItemId);
    const nextList = ownedAssets.filter((a) => a.instanceId !== instanceId);
    const payout = computeAssetQuickSellPayout(row);
    setOwnedAssets(nextList);
    setMoney((m) => clampMoney(m + payout));
    if (
      item &&
      item.weeklyBonus &&
      !shopItemStacksOnPurchase(item) &&
      row.kind !== "pokemon"
    ) {
      const stillHas = nextList.filter((a) => a.shopItemId === item.id).length;
      if (stillHas === 0) {
        setOwnedShopIds((prev) => prev.filter((id) => id !== item.id));
        setActivePerks((prev) => prev.filter((p) => p.shopItemId !== item.id));
      }
    }
    showHudToast(`Sold ${row.name} for $${payout}`);
  }

  function confirmFakeIdPurchase() {
    const id = fakeIdConfirmItemId;
    if (!id) return;
    const item = SHOP.find((i) => i.id === id);
    if (!item?.isFakeId) {
      setFakeIdConfirmItemId(null);
      return;
    }
    if (playerOwnsAnyFakeIdAsset(ownedAssets)) {
      setFakeIdConfirmItemId(null);
      return;
    }
    if (money < item.cost) {
      setFakeIdConfirmItemId(null);
      return;
    }
    completeShopPurchase(item);
    setFakeIdConfirmItemId(null);
  }

  function cancelFakeIdPurchase() {
    setFakeIdConfirmItemId(null);
  }

  const shopRegularItems = SHOP.filter(
    (i) => i.category === "shop" || i.category === "collectible",
  );
  const shopTransportItems = SHOP.filter((i) => i.category === "transport");
  const shopUnderground = SHOP.filter((i) => i.category === "underground");
  const fakeIdSoldOut = playerOwnsAnyFakeIdAsset(ownedAssets);
  const displayedAssets = filterAssetsForDisplay(ownedAssets);
  const netWorth = computeNetWorth(money, ownedAssets);

  if (gamePhase === "scenario" && activeScenario) {
    return (
      <>
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 100,
          }}
        >
          <SoundMuteHudButton muted={soundMutedUI} onToggle={toggleSoundMute} />
        </div>
        <ScenarioPopup
          key={activeScenario.id}
          scenario={activeScenario}
          resolveChoiceConsequence={
            activeScenario.id === FIRST_PARTY_COKE_SCENARIO_ID
              ? (i) =>
                  resolveFirstPartyCokeChoice(i) as ScenarioConsequence
              : undefined
          }
          onComplete={(choiceIndex, resolved) => {
            handleScenarioComplete(choiceIndex, resolved);
          }}
        />
      </>
    );
  }

  if (gamePhase === "cutscene") {
    const before = cutsceneStatsBefore ?? stats;
    const after = cutsceneStatsAfter ?? stats;
    return (
      <>
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 100,
          }}
        >
          <SoundMuteHudButton muted={soundMutedUI} onToggle={toggleSoundMute} />
        </div>
        <CutsceneScreen
        isLoading={isGeneratingStory}
        storyText={storyText}
        sceneImage={sceneImageFilename}
        week={currentWeek}
        year={currentYear}
        statsBefore={before}
        statsAfter={after}
        extraEvent={cutsceneExtraEvent}
        weekSelections={weekSelections}
        onContinue={() => {
          void handleCutsceneContinue();
        }}
      />
      </>
    );
  }

  if (gamePhase === "yearTransition") {
    const y = currentYear as 2 | 3 | 4;
    const copy = YEAR_TRANSITION_COPY[y] ?? {
      title: `Year ${currentYear}`,
      flavorLine: "",
    };
    return (
      <YearTransitionScreen
        key={`year-transition-${currentYear}`}
        title={copy.title}
        flavorLine={copy.flavorLine}
        onDismiss={() => {
          setGamePhase("picking");
        }}
      />
    );
  }

  const epHudColor =
    energyRemaining <= 2
      ? "#EF4444"
      : energyRemaining <= 4
        ? "#D73F09"
        : "#FFFFFF";

  const fakeIdModalItem =
    fakeIdConfirmItemId != null
      ? SHOP.find(
          (i) => i.id === fakeIdConfirmItemId && "isFakeId" in i && i.isFakeId,
        )
      : undefined;

  const spentEpThisWeek = WEEKLY_EP_MAX - energyRemaining;
  const slidePanelsOpen =
    activitiesPanelOpen ||
    careerPanelOpen ||
    shopPanelOpen ||
    summaryPanelOpen;
  const hudBtn: React.CSSProperties = {
    width: 180,
    padding: "12px 16px",
    background: "#D73F09",
    color: "#FFFFFF",
    border: "none",
    borderRadius: 10,
    textAlign: "center",
    cursor: "pointer",
    position: "relative",
  };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- full-viewport HUD background */}
      <img
        src="/scenes/dorm.png"
        alt=""
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.45)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {isGeneratingStory && gamePhase === "picking" ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0, 0, 0, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "auto",
          }}
        >
          <p
            className="osu-display-font osu-display-font--micro osu-simming-pulse"
            style={{ color: "#FFFFFF", textAlign: "center", padding: "0 1rem" }}
          >
            Simming to next week…
          </p>
        </div>
      ) : null}

      <div
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          background: "rgba(26, 26, 26, 0.85)",
          borderRadius: 20,
          padding: "10px 16px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "1.2rem", lineHeight: 1 }} aria-hidden>
              ⚡
            </span>
            <span
              style={{
                fontSize: "1.65rem",
                fontWeight: 800,
                color: epHudColor,
                fontVariantNumeric: "tabular-nums",
                transition: "color 0.25s ease",
              }}
            >
              {energyRemaining}
            </span>
          </div>
          <div
            style={{
              width: 1,
              height: 26,
              background: "rgba(255, 255, 255, 0.2)",
              flexShrink: 0,
            }}
            aria-hidden
          />
          <span
            style={{
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#1D9E75",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${money}
          </span>
        </div>
        {currentSoulmate ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: "#E91E8C",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              💕 {currentSoulmate.name}
            </span>
            <button
              type="button"
              onClick={handleBreakUp}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.65)",
                fontSize: "0.8rem",
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              💔 Break up
            </button>
          </div>
        ) : null}
      </div>

      <div
        style={{
          position: "fixed",
          top: currentSoulmate ? 118 : 70,
          left: 16,
          zIndex: 10,
          width: 248,
          background: "rgba(26, 26, 26, 0.85)",
          borderRadius: 12,
          padding: "10px 14px",
          boxSizing: "border-box",
        }}
      >
        <StatBars
          stats={stats}
          compact
          gpaAsNA={
            currentYear === 1 && currentWeek === 1 && gamePhase === "picking"
          }
        />
      </div>

      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <SoundMuteHudButton muted={soundMutedUI} onToggle={toggleSoundMute} />
        <button
          type="button"
          className="osu-display-font osu-display-font--micro osu-hud-panel-btn"
          onClick={openCareerPanel}
          style={hudBtn}
        >
          {activeJobId ? (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: 8,
                right: 10,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#1D9E75",
                boxShadow: "0 0 0 2px rgba(26,26,26,0.9)",
              }}
            />
          ) : null}
          Career
        </button>
        <button
          type="button"
          className="osu-display-font osu-display-font--micro osu-hud-panel-btn"
          onClick={openActivitiesPanel}
          style={hudBtn}
        >
          {spentEpThisWeek > 0 ? (
            <span
              aria-label={`${spentEpThisWeek} EP spent this week`}
              style={{
                position: "absolute",
                top: 8,
                right: 10,
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                borderRadius: 999,
                background: "#D73F09",
                color: "#FFFFFF",
                fontSize: "0.65rem",
                fontWeight: 800,
                lineHeight: "18px",
                textAlign: "center",
                boxShadow: "0 0 0 2px rgba(26,26,26,0.95)",
                border: "1px solid rgba(255,255,255,0.35)",
              }}
            >
              {spentEpThisWeek}
            </span>
          ) : null}
          Activities
        </button>
        <button
          type="button"
          className="osu-display-font osu-display-font--micro osu-hud-panel-btn"
          onClick={openShopPanel}
          style={hudBtn}
        >
          Shop
        </button>
        <button
          type="button"
          className="osu-display-font osu-display-font--micro osu-hud-panel-btn"
          onClick={openAssetsPanel}
          style={hudBtn}
        >
          Assets
        </button>
        <button
          type="button"
          className="osu-display-font osu-display-font--micro osu-hud-panel-btn"
          onClick={openSummaryPanel}
          style={hudBtn}
        >
          Summary
        </button>
      </div>

      <aside
        aria-hidden={!activitiesPanelOpen}
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          width: 340,
          height: "100vh",
          zIndex: 30,
          background: "#1A1A1A",
          transform: activitiesPanelOpen
            ? "translateX(0)"
            : "translateX(100%)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          pointerEvents: activitiesPanelOpen ? "auto" : "none",
        }}
      >
        <button
          type="button"
          className="osu-display-font"
          onClick={() => setActivitiesPanelOpen(false)}
          style={{
            flexShrink: 0,
            width: "100%",
            padding: "12px 14px",
            textAlign: "left",
            background: "rgba(0, 0, 0, 0.25)",
            color: "#FFFFFF",
            border: "none",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            cursor: "pointer",
            fontSize: "clamp(0.45rem, 2vw, 0.62rem)",
          }}
        >
          ◀ Close
        </button>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <ActivityPicker
            variant="panel"
            activities={ACTIVITIES}
            energyRemaining={energyRemaining}
            totalEnergy={WEEKLY_EP_MAX}
            currentYear={currentYear}
            weekSelections={weekSelections}
            onAdd={(id) => {
              const activity = ACTIVITIES.find((a) => a.id === id);
              if (!activity || energyRemaining < activity.epCost) return;
              const minY = (activity as { minYear?: number }).minYear;
              if (typeof minY === "number" && minY > currentYear) return;
              const maxPw = (activity as { maxPerWeek?: number }).maxPerWeek;
              if (typeof maxPw === "number" && maxPw >= 1) {
                const n = weekSelections.filter((x) => x === id).length;
                if (n >= maxPw) return;
              }
              setWeekSelections([...weekSelections, id]);
              setEnergyRemaining(energyRemaining - activity.epCost);
            }}
            onRemove={(id) => {
              const idx = weekSelections.lastIndexOf(id);
              if (idx !== -1) {
                const newSelections = [...weekSelections];
                newSelections.splice(idx, 1);
                const activity = ACTIVITIES.find((a) => a.id === id);
                setWeekSelections(newSelections);
                if (activity) {
                  setEnergyRemaining(energyRemaining + activity.epCost);
                }
              }
            }}
            onConfirm={handleActivityConfirm}
            hideFooter
          />
        </div>
      </aside>

      <aside
        aria-hidden={!careerPanelOpen}
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          width: 340,
          height: "100vh",
          zIndex: 30,
          background: "#1A1A1A",
          transform: careerPanelOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          pointerEvents: careerPanelOpen ? "auto" : "none",
        }}
      >
        <button
          type="button"
          className="osu-display-font"
          onClick={() => setCareerPanelOpen(false)}
          style={{
            flexShrink: 0,
            width: "100%",
            padding: "12px 14px",
            textAlign: "left",
            background: "rgba(0, 0, 0, 0.25)",
            color: "#FFFFFF",
            border: "none",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            cursor: "pointer",
            fontSize: PANEL_FS,
          }}
        >
          ◀ Close
        </button>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "12px 14px 24px",
            color: "#E8E8E8",
            fontSize: PANEL_FS,
            lineHeight: 1.45,
          }}
        >
          <h2
            className="osu-display-font"
            style={{
              margin: "0 0 12px",
              fontSize: PANEL_H2,
              color: "#FFFFFF",
            }}
          >
            Campus jobs
          </h2>
          {activeJobId ? (
            <button
              type="button"
              className="osu-display-font"
              onClick={() => setActiveJobId(null)}
              style={{
                marginBottom: 14,
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(239, 68, 68, 0.6)",
                background: "rgba(239, 68, 68, 0.12)",
                color: "#FCA5A5",
                cursor: "pointer",
                fontSize: PANEL_FS,
              }}
            >
              Quit current job
            </button>
          ) : null}
          {JOBS.filter((job) =>
            jobIsAvailable(job, currentYear, stats.gpa),
          ).map((job) => {
            const isCurrent = activeJobId === job.id;
            return (
              <div
                key={job.id}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: isCurrent
                    ? "1px solid rgba(29, 158, 117, 0.7)"
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="osu-display-font"
                  style={{
                    fontSize: PANEL_FS,
                    color: "#FFFFFF",
                    marginBottom: 4,
                  }}
                >
                  {job.name}
                </div>
                <div
                  style={{
                    fontSize: PANEL_FS,
                    opacity: 0.85,
                    marginBottom: 6,
                  }}
                >
                  {job.location} · {job.epCost} EP/wk · $
                  {job.weeklyPay}/wk
                  {job.minGpa != null && job.minGpa > 0
                    ? ` · min GPA ${job.minGpa}`
                    : ""}
                </div>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: PANEL_FS,
                    lineHeight: 1.45,
                    opacity: 0.9,
                  }}
                >
                  {job.description}
                </p>
                <button
                  type="button"
                  className="osu-display-font"
                  disabled={isCurrent}
                  onClick={() => handleJobApplyClick(job.id)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: isCurrent ? "rgba(29,158,117,0.35)" : "#D73F09",
                    color: "#FFFFFF",
                    cursor: isCurrent ? "default" : "pointer",
                    fontSize: PANEL_FS,
                    opacity: isCurrent ? 0.85 : 1,
                  }}
                >
                  {isCurrent ? "Current job" : "Apply"}
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      <aside
        aria-hidden={!shopPanelOpen}
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          width: 340,
          height: "100vh",
          zIndex: 30,
          background: "#1A1A1A",
          transform: shopPanelOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          pointerEvents: shopPanelOpen ? "auto" : "none",
        }}
      >
        <button
          type="button"
          className="osu-display-font"
          onClick={() => setShopPanelOpen(false)}
          style={{
            flexShrink: 0,
            width: "100%",
            padding: "12px 14px",
            textAlign: "left",
            background: "rgba(0, 0, 0, 0.25)",
            color: "#FFFFFF",
            border: "none",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            cursor: "pointer",
            fontSize: PANEL_FS,
          }}
        >
          ◀ Close
        </button>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "12px 14px 24px",
            color: "#E8E8E8",
            fontSize: PANEL_FS,
            lineHeight: 1.45,
          }}
        >
          <h2
            className="osu-display-font"
            style={{
              margin: "0 0 12px",
              fontSize: PANEL_H2,
              color: "#FFFFFF",
            }}
          >
            Shop
          </h2>
          {shopRegularItems.map((item) => {
            const ownedOngoing = !item.isOneTime && ownedShopIds.includes(item.id);
            const canAfford = money >= item.cost;
            const ageOk = shopItemPassesAgeGate(item, currentYear, fakeidRisk);
            const canBuy = canAfford && !ownedOngoing && ageOk;
            const ageLocked =
              item.minLegalPurchaseYear != null && !ageOk && !ownedOngoing;
            return (
              <div
                key={item.id}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  opacity: canBuy || ownedOngoing ? 1 : 0.45,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <div
                    className="osu-display-font"
                    style={{
                      fontSize: PANEL_FS,
                      color: "#FFFFFF",
                    }}
                  >
                    {item.name}
                  </div>
                  {ownedOngoing ? (
                    <span
                      className="osu-display-font osu-display-font--micro"
                      style={{
                        flexShrink: 0,
                        fontSize: PANEL_FS,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(29, 158, 117, 0.25)",
                        color: "#B8F0DC",
                        border: "1px solid #1D9E75",
                      }}
                    >
                      Owned
                    </span>
                  ) : null}
                </div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: PANEL_FS,
                    lineHeight: 1.45,
                    opacity: 0.9,
                  }}
                >
                  {item.description}
                </p>
                <div
                  style={{
                    fontSize: PANEL_FS,
                    marginBottom: 6,
                    color: "#1D9E75",
                    fontWeight: 700,
                  }}
                >
                  ${item.cost}
                </div>
                <div
                  style={{
                    fontSize: PANEL_FS,
                    marginBottom: 8,
                    opacity: 0.88,
                  }}
                >
                  Now:{" "}
                  {formatStatDelta(item.effect as Record<string, number>)}
                  {!item.isOneTime && item.weeklyBonus ? (
                    <>
                      {" "}
                      · Weekly:{" "}
                      {formatStatDelta(
                        item.weeklyBonus as unknown as Record<
                          string,
                          number
                        >,
                      )}
                    </>
                  ) : null}
                </div>
                {ageLocked ? (
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: PANEL_FS,
                      lineHeight: 1.45,
                      color: "#FCA5A5",
                      fontStyle: "italic",
                    }}
                  >
                    You are underage — bartenders card at the door. Come back junior
                    year, or buy a fake ID from the Underground market.
                  </p>
                ) : null}
                <button
                  type="button"
                  className="osu-display-font"
                  disabled={!canBuy}
                  onClick={() => buyShopItem(item.id)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: !canBuy ? "rgba(120,120,120,0.35)" : "#1D9E75",
                    color: "#FFFFFF",
                    cursor: !canBuy ? "not-allowed" : "pointer",
                    fontSize: PANEL_FS,
                  }}
                >
                  {ownedOngoing
                    ? "Owned"
                    : !ageOk
                      ? "Underage"
                      : !canAfford
                        ? "Cannot afford"
                        : "Buy"}
                </button>
              </div>
            );
          })}

          <h3
            className="osu-display-font"
            style={{
              margin: "20px 0 10px",
              fontSize: PANEL_H2,
              color: "#93C5FD",
            }}
          >
            Transport
          </h3>
          {shopTransportItems.map((item) => {
            const canAfford = money >= item.cost;
            const ageOk = shopItemPassesAgeGate(item, currentYear, fakeidRisk);
            const canBuy = canAfford && ageOk;
            return (
              <div
                key={item.id}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(59,130,246,0.08)",
                  border: "1px solid rgba(147,197,253,0.25)",
                  opacity: canBuy ? 1 : 0.45,
                }}
              >
                <div
                  className="osu-display-font"
                  style={{
                    fontSize: PANEL_FS,
                    color: "#FFFFFF",
                    marginBottom: 6,
                  }}
                >
                  {item.name}
                </div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: PANEL_FS,
                    lineHeight: 1.45,
                    opacity: 0.9,
                  }}
                >
                  {item.description}
                </p>
                <div
                  style={{
                    fontSize: PANEL_FS,
                    marginBottom: 6,
                    color: "#93C5FD",
                    fontWeight: 700,
                  }}
                >
                  ${item.cost}
                </div>
                <div
                  style={{
                    fontSize: PANEL_FS,
                    marginBottom: 8,
                    opacity: 0.88,
                  }}
                >
                  Now:{" "}
                  {formatStatDelta(item.effect as Record<string, number>)}
                </div>
                <button
                  type="button"
                  className="osu-display-font"
                  disabled={!canBuy}
                  onClick={() => buyShopItem(item.id)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: !canBuy ? "rgba(120,120,120,0.35)" : "#2563EB",
                    color: "#FFFFFF",
                    cursor: !canBuy ? "not-allowed" : "pointer",
                    fontSize: PANEL_FS,
                  }}
                >
                  {!ageOk
                    ? "Underage"
                    : !canAfford
                      ? "Cannot afford"
                      : "Buy"}
                </button>
              </div>
            );
          })}

          <h3
            className="osu-display-font"
            style={{
              margin: "20px 0 10px",
              fontSize: PANEL_H2,
              color: "#FCA5A5",
            }}
          >
            Underground market
          </h3>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: PANEL_FS,
              lineHeight: 1.45,
              color: "#F87171",
              border: "1px solid rgba(248, 113, 113, 0.45)",
              borderRadius: 8,
              padding: "10px 12px",
              background: "rgba(127, 29, 29, 0.2)",
            }}
          >
            <strong style={{ color: "#FECACA" }}>Illegal — high stakes.</strong>{" "}
            Cheap IDs carry about a <strong>20% chance each week</strong> of a
            Corvallis PD fake-ID arrest (heavy social, happiness, and GPA hits
            plus <strong>$200</strong> in lawyer fees). “Premium” IDs still risk
            about a <strong>5% weekly</strong> bust with milder penalties and{" "}
            <strong>$150</strong> in fees. You still get the one-time social
            boost if you buy — then you live with the roll every week.
          </p>
          {shopUnderground.map((item) => {
            const canAfford = money >= item.cost;
            const soldOut = Boolean(item.isFakeId && fakeIdSoldOut);
            const canBuyUnderground = canAfford && !soldOut;
            return (
              <div
                key={item.id}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(127, 29, 29, 0.12)",
                  border: "1px solid rgba(248, 113, 113, 0.35)",
                  opacity: canBuyUnderground ? 1 : 0.45,
                }}
              >
                <div
                  className="osu-display-font"
                  style={{
                    fontSize: PANEL_FS,
                    color: "#FECACA",
                    marginBottom: 6,
                  }}
                >
                  {item.name}
                </div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: PANEL_FS,
                    lineHeight: 1.45,
                    color: "#FEE2E2",
                  }}
                >
                  {item.description}
                </p>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: PANEL_FS,
                    lineHeight: 1.45,
                    color: "#FCA5A5",
                  }}
                >
                  {item.fakeidRisk === "high"
                    ? "Risk: ~20% arrest chance per week if you carry this route — stats tank + $200 fees."
                    : "Risk: ~5% arrest chance per week — milder stat hits + $150 fees."}
                </p>
                <div
                  style={{
                    fontSize: PANEL_FS,
                    marginBottom: 6,
                    color: "#F87171",
                    fontWeight: 700,
                  }}
                >
                  ${item.cost}
                </div>
                <div
                  style={{
                    fontSize: PANEL_FS,
                    marginBottom: 8,
                    opacity: 0.9,
                    color: "#FEE2E2",
                  }}
                >
                  Instant:{" "}
                  {formatStatDelta(item.effect as Record<string, number>)}
                </div>
                <button
                  type="button"
                  className="osu-display-font"
                  disabled={!canBuyUnderground}
                  onClick={() => buyShopItem(item.id)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: !canBuyUnderground
                      ? "rgba(120,120,120,0.35)"
                      : "#B91C1C",
                    color: "#FFFFFF",
                    cursor: !canBuyUnderground ? "not-allowed" : "pointer",
                    fontSize: PANEL_FS,
                  }}
                >
                  {soldOut
                    ? "Sold Out"
                    : canAfford
                      ? "Buy (confirm risk)"
                      : "Cannot afford"}
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      <aside
        aria-hidden={!assetsPanelOpen}
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          width: 340,
          height: "100vh",
          zIndex: 30,
          background: "#1A1A1A",
          transform: assetsPanelOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          pointerEvents: assetsPanelOpen ? "auto" : "none",
        }}
      >
        <button
          type="button"
          className="osu-display-font"
          onClick={() => setAssetsPanelOpen(false)}
          style={{
            flexShrink: 0,
            width: "100%",
            padding: "12px 14px",
            textAlign: "left",
            background: "rgba(0, 0, 0, 0.25)",
            color: "#FFFFFF",
            border: "none",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            cursor: "pointer",
            fontSize: PANEL_FS,
          }}
        >
          ◀ Close
        </button>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "12px 14px 24px",
            color: "#E8E8E8",
            fontSize: PANEL_FS,
            lineHeight: 1.45,
          }}
        >
          <h2
            className="osu-display-font"
            style={{
              margin: "0 0 12px",
              fontSize: PANEL_H2,
              color: "#FFFFFF",
            }}
          >
            Assets
          </h2>
          <div
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div
              style={{
                fontSize: PANEL_FS,
                opacity: 0.85,
                marginBottom: 4,
              }}
            >
              Net Worth
            </div>
            <div
              className="osu-display-font"
              style={{
                fontSize: PANEL_H2,
                color: "#1D9E75",
                fontWeight: 800,
              }}
            >
              ${netWorth.toLocaleString()}
            </div>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: PANEL_FS,
                lineHeight: 1.45,
                opacity: 0.75,
              }}
            >
              Cash plus face value of physical inventory (food and drinks are
              not counted).
            </p>
          </div>
          {displayedAssets.length === 0 ? (
            <p
              style={{
                margin: 0,
                fontSize: PANEL_FS,
                opacity: 0.75,
              }}
            >
              Nothing in your inventory yet — hit the Shop to buy gear.
            </p>
          ) : (
            displayedAssets.map((asset) => {
              const sellable = assetRowAllowsQuickSell(asset);
              const sellPrice = computeAssetQuickSellPayout(asset);
              return (
                <div
                  key={asset.instanceId}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div
                    className="osu-display-font"
                    style={{
                      fontSize: PANEL_FS,
                      color: "#FFFFFF",
                      marginBottom: 6,
                    }}
                  >
                    {asset.name}
                  </div>
                  <div
                    style={{
                      fontSize: PANEL_FS,
                      marginBottom: 8,
                      color: "#A3A3A3",
                    }}
                  >
                    Paid ${asset.purchasePrice.toLocaleString()}
                  </div>
                  {sellable ? (
                    <button
                      type="button"
                      className="osu-display-font"
                      onClick={() => quickSellAsset(asset.instanceId)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: "#D73F09",
                        color: "#FFFFFF",
                        cursor: "pointer",
                        fontSize: PANEL_FS,
                      }}
                    >
                      Quick Sell (${sellPrice.toLocaleString()})
                    </button>
                  ) : (
                    <span
                      style={{
                        fontSize: PANEL_FS,
                        fontStyle: "italic",
                        opacity: 0.75,
                      }}
                    >
                      Non-sellable
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>

      <aside
        aria-hidden={!summaryPanelOpen}
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          width: 340,
          height: "100vh",
          zIndex: 30,
          background: "#1A1A1A",
          transform: summaryPanelOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          pointerEvents: summaryPanelOpen ? "auto" : "none",
        }}
      >
        <button
          type="button"
          className="osu-display-font"
          onClick={() => setSummaryPanelOpen(false)}
          style={{
            flexShrink: 0,
            width: "100%",
            padding: "12px 14px",
            textAlign: "left",
            background: "rgba(0, 0, 0, 0.25)",
            color: "#FFFFFF",
            border: "none",
            borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            cursor: "pointer",
            fontSize: PANEL_FS,
          }}
        >
          ◀ Close
        </button>
        <h2
          className="osu-display-font"
          style={{
            flexShrink: 0,
            margin: 0,
            padding: "10px 14px 8px",
            color: "#D73F09",
            fontSize: PANEL_H2,
          }}
        >
          Your OSU Story
        </h2>
        <div
          style={{
            height: "calc(100vh - 80px)",
            overflowY: "auto",
            padding: "0 14px 20px",
            boxSizing: "border-box",
            fontSize: PANEL_FS,
            lineHeight: 1.45,
          }}
        >
          {weekHistory.length === 0 ? (
            <p
              style={{
                margin: "48px 0 0",
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.45)",
                fontSize: PANEL_FS,
                lineHeight: 1.5,
              }}
            >
              Your story is just beginning…
            </p>
          ) : (
            [...new Set(weekHistory.map((e) => e.year))]
              .sort((a, b) => a - b)
              .map((y) => (
                <section key={y} style={{ marginBottom: 12 }}>
                  <h3
                    className="osu-display-font"
                    style={{
                      margin: "0 0 6px",
                      color: "#FFFFFF",
                      fontSize: PANEL_H2,
                    }}
                  >
                    {yearStoryHeading(y)}
                  </h3>
                  {weekHistory
                    .filter((e) => e.year === y)
                    .sort((a, b) => a.week - b.week)
                    .map((entry) => {
                      const statLine = formatStatChangeLine(
                        entry.statsBefore,
                        entry.statsAfter,
                      );
                      const statTokens =
                        statLine === "—"
                          ? []
                          : statLine.split("  ").filter(Boolean);
                      const evLine = historyEventTitlesLine(entry);
                      return (
                        <div
                          key={`${entry.year}-${entry.week}`}
                          style={{
                            marginBottom: 8,
                            lineHeight: 1.35,
                            fontSize: PANEL_FS,
                            color: "rgba(255, 255, 255, 0.88)",
                          }}
                        >
                          <div
                            className="osu-display-font"
                            style={{
                              color: "#D73F09",
                              fontSize: PANEL_FS,
                              marginBottom: 0,
                            }}
                          >
                            Week {entry.week}
                          </div>
                          <div style={{ margin: 0, padding: 0 }}>
                            Activities:{" "}
                            {entry.activitiesChosen.length
                              ? historyActivitiesSummaryLine(
                                  entry.activitiesChosen,
                                )
                              : "—"}
                          </div>
                          {entry.jobWorked ? (
                            <div style={{ margin: 0, padding: 0 }}>
                              Worked at {entry.jobWorked} — ${entry.moneyEarned}
                            </div>
                          ) : null}
                          {entry.shopItemsBought.length ? (
                            <div style={{ margin: 0, padding: 0 }}>
                              Bought: {entry.shopItemsBought.join(", ")}
                            </div>
                          ) : null}
                          {evLine ? (
                            <div
                              className="osu-display-font"
                              style={{
                                color: "#D73F09",
                                margin: 0,
                                padding: 0,
                                fontSize: PANEL_FS,
                              }}
                            >
                              {evLine}
                            </div>
                          ) : null}
                          <div style={{ margin: 0, padding: 0 }}>
                            {statTokens.length === 0 ? (
                              <span style={{ color: "rgba(255,255,255,0.4)" }}>
                                —
                              </span>
                            ) : (
                              statTokens.map((tok, i) => (
                                <span key={i}>
                                  {i > 0 ? "  " : null}
                                  <span
                                    style={{
                                      color: tok.trim().startsWith("+")
                                        ? "#4ADE80"
                                        : "#F87171",
                                    }}
                                  >
                                    {tok}
                                  </span>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                </section>
              ))
          )}
        </div>
      </aside>

      {gamePhase === "picking" && !isGeneratingStory ? (
        <div
          style={{
            position: "fixed",
            right: slidePanelsOpen ? 370 : 20,
            bottom: 20,
            zIndex: 10050,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            transition: "right 0.3s ease",
          }}
        >
          <button
            type="button"
            aria-label="Next week"
            disabled={spentEpThisWeek < 1}
            onClick={() => handleActivityConfirm()}
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              border: "none",
              background: spentEpThisWeek < 1 ? "#8B5A45" : "#CC4500",
              color: "#FFFFFF",
              fontSize: 28,
              lineHeight: 1,
              cursor: spentEpThisWeek < 1 ? "not-allowed" : "pointer",
              boxShadow: "0 6px 22px rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            →
          </button>
          <span
            className="osu-display-font"
            style={{
              color: "#FFFFFF",
              fontSize: PANEL_FS,
              textAlign: "center",
              textShadow: "0 1px 6px rgba(0,0,0,0.9)",
              maxWidth: 120,
            }}
          >
            Next Week
          </span>
        </div>
      ) : null}

      <div
        className="osu-display-font osu-display-font--micro"
        style={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          background: "rgba(26, 26, 26, 0.85)",
          borderRadius: 20,
          padding: "10px 18px",
          whiteSpace: "nowrap",
        }}
      >
        Year {currentYear} · Week {currentWeek}
      </div>

      {toast.message ? (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: "fixed",
            bottom: 80,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 50,
            maxWidth: "min(92vw, 420px)",
            padding: "10px 20px",
            borderRadius: 20,
            background: "rgba(26, 26, 26, 0.95)",
            color: "#FFFFFF",
            border: "1px solid #1D9E75",
            fontSize: 14,
            lineHeight: 1.4,
            textAlign: "center",
            boxSizing: "border-box",
            opacity: toast.visible ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: toast.visible ? "auto" : "none",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
          }}
        >
          {toast.message}
        </div>
      ) : null}

      {gamblingModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gambling-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: "rgba(0, 0, 0, 0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              backgroundColor: "#141210",
              border: "1px solid rgba(215, 63, 9, 0.45)",
              borderRadius: 14,
              padding: "22px 20px",
              color: "#fafaf9",
            }}
          >
            <h2
              id="gambling-modal-title"
              className="osu-display-font"
              style={{
                margin: "0 0 14px",
                fontSize: "clamp(0.5rem, 2vw, 0.7rem)",
                color: "#fff",
              }}
            >
              How much do you want to bet?
            </h2>
            <input
              type="text"
              inputMode="decimal"
              value={gamblingBetInput}
              onChange={(e) => setGamblingBetInput(e.target.value)}
              placeholder={`Max $${money}`}
              style={{
                width: "100%",
                marginBottom: 14,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "#0d0d0d",
                color: "#fff",
                fontSize: 16,
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="osu-display-font"
                onClick={() => {
                  setGamblingModalOpen(false);
                  setGamblingBetInput("");
                }}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="osu-display-font"
                onClick={handleGamblingBetSubmit}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#D73F09",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {gamblingResultModal ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: "rgba(0, 0, 0, 0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              backgroundColor: "#141210",
              border: "1px solid rgba(215, 63, 9, 0.45)",
              borderRadius: 14,
              padding: "22px 20px",
              color: "#fafaf9",
            }}
          >
            <p style={{ margin: "0 0 18px", lineHeight: 1.55, fontSize: 15 }}>
              {gamblingResultModal}
            </p>
            <button
              type="button"
              className="osu-display-font"
              onClick={acknowledgeGamblingResult}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "#D73F09",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      {jobResultModal ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: "rgba(0, 0, 0, 0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              backgroundColor: "#141210",
              border: "1px solid rgba(215, 63, 9, 0.45)",
              borderRadius: 14,
              padding: "22px 20px",
              color: "#fafaf9",
            }}
          >
            <p style={{ margin: "0 0 18px", lineHeight: 1.55, fontSize: 15 }}>
              {jobResultModal.accepted
                ? `You got the job! You're now working as ${jobResultModal.jobName}. ${jobResultModal.epCost} EP will be charged each week and you'll earn $${jobResultModal.weeklyPay}/week.`
                : "Sorry, your application was not accepted."}
            </p>
            <button
              type="button"
              className="osu-display-font"
              onClick={() => setJobResultModal(null)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "#D73F09",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      {jobNoPayModal ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: "rgba(0, 0, 0, 0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              backgroundColor: "#141210",
              border: "1px solid rgba(215, 63, 9, 0.45)",
              borderRadius: 14,
              padding: "22px 20px",
              color: "#fafaf9",
            }}
          >
            <p style={{ margin: "0 0 18px", lineHeight: 1.55 }}>
              You didn&apos;t have enough energy for work this week. No pay.
            </p>
            <button
              type="button"
              className="osu-display-font"
              onClick={() => setJobNoPayModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "#D73F09",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      {cryptoFiredModal ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: "rgba(0, 0, 0, 0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              backgroundColor: "#141210",
              border: "1px solid rgba(215, 63, 9, 0.45)",
              borderRadius: 14,
              padding: "22px 20px",
              color: "#fafaf9",
            }}
          >
            <p style={{ margin: "0 0 18px", lineHeight: 1.55 }}>
              You&apos;re broke. You can no longer trade crypto.
            </p>
            <button
              type="button"
              className="osu-display-font"
              onClick={() => setCryptoFiredModal(false)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: "#D73F09",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      {cryptoJobApplyId ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: "rgba(0, 0, 0, 0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              backgroundColor: "#141210",
              border: "1px solid rgba(215, 63, 9, 0.45)",
              borderRadius: 14,
              padding: "22px 20px",
              color: "#fafaf9",
            }}
          >
            <p style={{ margin: "0 0 18px", lineHeight: 1.55 }}>
              ⚠️ High Risk: Crypto trading is volatile. You may lose money. Are
              you sure?
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="osu-display-font"
                onClick={() => setCryptoJobApplyId(null)}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "transparent",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="osu-display-font"
                onClick={confirmCryptoJobApply}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#D73F09",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {fakeIdModalItem ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fake-id-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            backgroundColor: "rgba(0, 0, 0, 0.82)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 520,
              backgroundColor: "#141210",
              border: "1px solid rgba(215, 63, 9, 0.45)",
              borderRadius: 14,
              padding: "24px 22px 22px",
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.55)",
              color: "#fafaf9",
              fontFamily:
                'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
          >
            <h2
              id="fake-id-modal-title"
              className="osu-display-font"
              style={{
                margin: "0 0 12px",
                fontSize: "clamp(0.55rem, 2.2vw, 0.75rem)",
                fontWeight: 800,
                lineHeight: 1.25,
                color: "#fff",
              }}
            >
              Confirm underground purchase
            </h2>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: "clamp(0.38rem, 1.5vw, 0.52rem)",
                lineHeight: 1.5,
                color: "rgba(255, 255, 255, 0.88)",
              }}
            >
              <strong>{fakeIdModalItem.name}</strong> — ${fakeIdModalItem.cost}
            </p>
            <p
              style={{
                margin: "0 0 22px",
                fontSize: "clamp(0.36rem, 1.45vw, 0.5rem)",
                lineHeight: 1.55,
                color: "rgba(254, 226, 226, 0.92)",
              }}
            >
              {fakeIdModalItem.fakeidRisk === "high"
                ? "HIGH RISK: about 20% chance EACH WEEK of a fake-ID bust with Corvallis PD — big hits to social, happiness, and GPA, plus $200 in lawyer fees."
                : "LOWER RISK: about 5% chance EACH WEEK of the same kind of arrest — milder stat penalties and $150 in fees."}{" "}
              Buying still adds the listed social boost once.
            </p>
            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="osu-display-font"
                onClick={cancelFakeIdPurchase}
                style={{
                  padding: "12px 18px",
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "clamp(0.38rem, 1.5vw, 0.5rem)",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="osu-display-font"
                onClick={confirmFakeIdPurchase}
                style={{
                  padding: "12px 18px",
                  borderRadius: 10,
                  border: "none",
                  background: "#B91C1C",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "clamp(0.38rem, 1.5vw, 0.5rem)",
                  fontWeight: 700,
                }}
              >
                Confirm purchase
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
