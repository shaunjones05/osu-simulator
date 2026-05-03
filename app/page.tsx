"use client";

import React, { useState } from "react";
import {
  ACTIVITIES,
  INITIAL_STATS,
  ENERGY_BY_YEAR,
  JOBS,
  SHOP,
  getSpecialEvent,
  getRandEvent,
  getBlazersBetResult,
  rollFakeIdArrest,
  jobIsAvailable,
} from "./lib/gameData.js";
import {
  applyWeek,
  applyPassiveEffects,
  checkGameOver,
  getEnding,
} from "./lib/gameLogic.js";
import { generateCutscene, generateCustomEnding } from "./lib/aiCutscene.js";
import { getScenarioForWeek } from "./lib/scenarios.js";
import StartScreen from "./components/StartScreen";
import StatBars from "./components/StatBars";
import ActivityPicker from "./components/ActivityPicker";
import ScenarioPopup, {
  type ScenarioForPopup,
} from "./components/ScenarioPopup";
import CutsceneScreen, {
  type CutsceneExtraEvent,
} from "./components/CutsceneScreen";
import type { WeekStats } from "./components/WeekSummary";
import GameOver from "./components/GameOver";
import GraduationScreen, {
  type GraduationEnding,
} from "./components/GraduationScreen";

type GamePhase =
  | "picking"
  | "cutscene"
  | "scenario"
  | "gameover"
  | "graduation";

type FakeIdRisk = "none" | "high" | "low";

type ActivePerk = {
  shopItemId: string;
  weeklyBonus: Record<string, number> | null;
};

function clampMoney(n: number): number {
  const x = Math.round(Number(n));
  if (Number.isNaN(x)) return 0;
  return Math.max(0, x);
}

const STAT_KEYS = ["gpa", "health", "happiness", "social"] as const;

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

export default function Home() {
  const [playerName, setPlayerName] = useState("");
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
  const [money, setMoney] = useState(500);
  const [fakeidRisk, setFakeidRisk] = useState<FakeIdRisk>("none");
  const [fakeIdConfirmItemId, setFakeIdConfirmItemId] = useState<string | null>(
    null,
  );
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [ownedShopIds, setOwnedShopIds] = useState<string[]>([]);
  const [activePerks, setActivePerks] = useState<ActivePerk[]>([]);
  const [usedScenarioIds, setUsedScenarioIds] = useState<string[]>([]);
  const [pendingApiScenario, setPendingApiScenario] =
    useState<ScenarioForPopup | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioForPopup | null>(
    null,
  );

  if (!gameStarted) {
    return (
      <StartScreen
        onStart={(name) => {
          setPlayerName(name);
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
          setMoney(500);
          setFakeidRisk("none");
          setFakeIdConfirmItemId(null);
          setActiveJobId(null);
          setOwnedShopIds([]);
          setActivePerks([]);
          setUsedScenarioIds([]);
          setPendingApiScenario(null);
          setActiveScenario(null);
          setGameStarted(true);
        }}
      />
    );
  }

  if (gamePhase === "gameover") {
    return (
      <GameOver
        reason={gameOverReason}
        week={currentWeek}
        year={currentYear}
        finalStats={stats}
        onRestart={() => {
          setGameStarted(false);
        }}
      />
    );
  }

  if (gamePhase === "graduation") {
    return (
      <GraduationScreen
        playerName={playerName}
        ending={finalEnding}
        aiEndingText={aiEndingText}
        finalStats={stats}
        onRestart={() => {
          setGameStarted(false);
        }}
      />
    );
  }

  async function resolveWeekEnd(
    statsBefore: WeekStats,
    selections: string[],
    year: number,
    week: number,
    baseline: WeekStats,
    name: string,
    scenarioIdsForApi: string[],
    moneyBefore: number,
    activeJobIdAtStart: string | null,
    activePerksSnapshot: ActivePerk[],
    fakeidRiskAtStart: FakeIdRisk,
  ) {
    let s: WeekStats = normalizeWeekStats(
      applyWeek(statsBefore, selections, ACTIVITIES),
    );
    s = normalizeWeekStats(
      applyPassiveEffects(s, { activePerks: activePerksSnapshot }),
    );

    const special = getSpecialEvent(year, week);
    if (special) {
      const rawEffect =
        typeof special.effect === "function"
          ? special.effect(s)
          : special.effect;
      s = normalizeWeekStats(applyStatDelta(s, rawEffect));
    }

    let extra: CutsceneExtraEvent | null = null;
    const rand = getRandEvent();
    if (rand) {
      if ("isBet" in rand && rand.isBet) {
        const bet = getBlazersBetResult();
        extra = {
          title: rand.title,
          description: `${rand.description}\n\n${bet.message}`,
        };
        s = normalizeWeekStats(applyStatDelta(s, bet.effect));
      } else {
        extra = { title: rand.title, description: rand.description };
        s = normalizeWeekStats(applyStatDelta(s, rand.effect));
      }
    }

    const job = activeJobIdAtStart
      ? JOBS.find((j) => j.id === activeJobIdAtStart)
      : null;
    let moneyNetChange = job ? job.weeklyPay : 0;

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
      if (extra) {
        extra = {
          title: "This week at OSU",
          description: `${extra.title}: ${extra.description}\n\n— ${arrestExtra.title}: ${arrestExtra.description}`,
        };
      } else {
        extra = arrestExtra;
      }
    }

    const finalStats = normalizeWeekStats(s);
    const sceneFile = pickSceneImageFromSelections(selections);

    const jobLine = job
      ? `${job.name} at ${job.location} ($${job.weeklyPay}/week, ${job.epCost} EP/week)`
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
    };
  }

  function handleActivityConfirm() {
    const job = activeJobId
      ? JOBS.find((j) => j.id === activeJobId)
      : null;
    const jobEp = job?.epCost ?? 0;
    if (jobEp > 0 && energyRemaining < jobEp) {
      window.alert(
        `Your job uses ${jobEp} EP this week, but you only have ${energyRemaining} EP left after activities. Remove some activities or quit your job in Career before ending the week.`,
      );
      return;
    }

    const statsBefore: WeekStats = { ...stats };
    const selections = [...weekSelections];
    const year = currentYear;
    const week = currentWeek;
    const baseline = { ...week1BaselineStats };
    const name = playerName;
    const moneySnap = money;
    const jobSnap = activeJobId;
    const perksSnap = [...activePerks];
    const riskSnap = fakeidRisk;

    setIsGeneratingStory(true);
    setActivitiesPanelOpen(false);
    setCareerPanelOpen(false);
    setShopPanelOpen(false);
    setPendingApiScenario(null);
    setGamePhase("cutscene");

    void (async () => {
      const { finalStats, story, sceneFile, extra, apiScenario, moneyNetChange } =
        await resolveWeekEnd(
          statsBefore,
          selections,
          year,
          week,
          baseline,
          name,
          usedScenarioIds,
          moneySnap,
          jobSnap,
          perksSnap,
          riskSnap,
        );

      setPendingApiScenario(apiScenario);
      setStoryText(story);
      setSceneImageFilename(sceneFile);
      setCutsceneExtraEvent(extra);
      setCutsceneStatsBefore(statsBefore);
      setCutsceneStatsAfter(finalStats);
      setStats(finalStats);
      setMoney((m) => clampMoney(m + moneyNetChange));
      setIsGeneratingStory(false);

      const over = checkGameOver(finalStats);
      if (over.isOver) {
        setGameOverReason(over.reason);
        setGamePhase("gameover");
      }
    })();
  }

  async function advanceAfterWeekResolved(latestStats: WeekStats) {
    if (currentWeek < 8) {
      setCurrentWeek((w) => w + 1);
      setWeekSelections([]);
      setActivitiesPanelOpen(false);
      setCareerPanelOpen(false);
      setShopPanelOpen(false);
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
      setGamePhase("picking");
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

  function handleScenarioComplete(choiceIndex: number) {
    if (!activeScenario) return;
    const raw = activeScenario.choices[choiceIndex]?.consequence;
    if (!raw || typeof raw !== "object") return;
    const con = raw as Record<string, unknown>;
    const delta = deltaFromConsequence(con);
    const nextStats = normalizeWeekStats(applyStatDelta(stats, delta));
    setStats(nextStats);
    setUsedScenarioIds((prev) => [
      ...prev,
      scenarioUsedId(activeScenario, currentYear),
    ]);
    setActiveScenario(null);
    const over = checkGameOver(nextStats);
    if (over.isOver) {
      setGameOverReason(over.reason);
      setGamePhase("gameover");
      return;
    }
    void advanceAfterWeekResolved(nextStats);
  }

  function openActivitiesPanel() {
    setCareerPanelOpen(false);
    setShopPanelOpen(false);
    setActivitiesPanelOpen(true);
  }

  function openCareerPanel() {
    setActivitiesPanelOpen(false);
    setShopPanelOpen(false);
    setCareerPanelOpen(true);
  }

  function openShopPanel() {
    setActivitiesPanelOpen(false);
    setCareerPanelOpen(false);
    setShopPanelOpen(true);
  }

  function completeShopPurchase(item: (typeof SHOP)[number]) {
    setMoney((m) => clampMoney(m - item.cost));
    setStats((st) => normalizeWeekStats(applyStatDelta(st, item.effect)));
    if (item.isFakeId && item.fakeidRisk) {
      setFakeidRisk(item.fakeidRisk);
    }
    if (!item.isOneTime && item.weeklyBonus) {
      setOwnedShopIds((prev) =>
        prev.includes(item.id) ? prev : [...prev, item.id],
      );
      setActivePerks((prev) => [
        ...prev,
        { shopItemId: item.id, weeklyBonus: item.weeklyBonus },
      ]);
    }
  }

  function buyShopItem(itemId: string) {
    const item = SHOP.find((i) => i.id === itemId);
    if (!item) return;
    if (money < item.cost) return;
    if (!item.isOneTime && ownedShopIds.includes(itemId)) return;

    if (item.isFakeId) {
      setFakeIdConfirmItemId(itemId);
      return;
    }

    completeShopPurchase(item);
  }

  function confirmFakeIdPurchase() {
    const id = fakeIdConfirmItemId;
    if (!id) return;
    const item = SHOP.find((i) => i.id === id);
    if (!item?.isFakeId) {
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

  const activeJob = activeJobId
    ? JOBS.find((j) => j.id === activeJobId)
    : null;
  const shopMainItems = SHOP.filter((i) => i.category !== "underground");
  const shopUnderground = SHOP.filter((i) => i.category === "underground");

  if (gamePhase === "scenario" && activeScenario) {
    return (
      <ScenarioPopup
        key={activeScenario.id}
        scenario={activeScenario}
        onComplete={(choiceIndex) => {
          handleScenarioComplete(choiceIndex);
        }}
      />
    );
  }

  if (gamePhase === "cutscene") {
    const before = cutsceneStatsBefore ?? stats;
    const after = cutsceneStatsAfter ?? stats;
    return (
      <CutsceneScreen
        isLoading={isGeneratingStory}
        storyText={storyText}
        sceneImage={sceneImageFilename}
        week={currentWeek}
        year={currentYear}
        statsBefore={before}
        statsAfter={after}
        extraEvent={cutsceneExtraEvent}
        onContinue={() => {
          void handleCutsceneContinue();
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

      <div
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: 10,
          width: 220,
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
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
          maxWidth: "min(92vw, 320px)",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(26, 26, 26, 0.85)",
              borderRadius: 20,
              padding: "8px 16px",
              boxSizing: "border-box",
            }}
          >
            <span style={{ fontSize: "1.25rem", lineHeight: 1 }} aria-hidden>
              ⚡
            </span>
            <span
              style={{
                fontSize: "1.75rem",
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
              background: "rgba(26, 26, 26, 0.85)",
              borderRadius: 999,
              padding: "8px 18px",
              boxSizing: "border-box",
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#1D9E75",
              fontVariantNumeric: "tabular-nums",
            }}
            title="Spendable cash"
          >
            ${money}
          </div>
        </div>
        <div
          className="osu-display-font osu-display-font--micro"
          style={{
            background: "rgba(26, 26, 26, 0.85)",
            borderRadius: 10,
            padding: "6px 12px",
            color: "#FFFFFF",
            textAlign: "right",
            fontSize: "clamp(0.42rem, 1.6vw, 0.55rem)",
            lineHeight: 1.35,
            maxWidth: "100%",
          }}
        >
          {activeJob ? (
            <>
              <span style={{ opacity: 0.75 }}>Job: </span>
              {activeJob.name} · ${activeJob.weeklyPay}/wk · {activeJob.epCost}{" "}
              EP/wk
            </>
          ) : (
            <span style={{ opacity: 0.65 }}>No job — open Career</span>
          )}
        </div>
        {activePerks.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              justifyContent: "flex-end",
            }}
          >
            {activePerks.map((p) => {
              const label =
                SHOP.find((s) => s.id === p.shopItemId)?.name ?? p.shopItemId;
              return (
                <span
                  key={p.shopItemId}
                  className="osu-display-font osu-display-font--micro"
                  style={{
                    fontSize: "clamp(0.38rem, 1.4vw, 0.48rem)",
                    padding: "3px 8px",
                    borderRadius: 999,
                    background: "rgba(29, 158, 117, 0.2)",
                    color: "#B8F0DC",
                    border: "1px solid rgba(29, 158, 117, 0.55)",
                    maxWidth: "100%",
                  }}
                  title="Ongoing shop perk — bonus each week"
                >
                  {label}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className="osu-display-font"
        onClick={openCareerPanel}
        style={{
          position: "fixed",
          right: 0,
          top: "calc(50% - 108px)",
          transform: "translateY(-50%)",
          zIndex: 20,
          background: "#2A2A2A",
          color: "#FFFFFF",
          border: "none",
          borderTopLeftRadius: 10,
          borderBottomLeftRadius: 10,
          padding: "14px 10px",
          cursor: "pointer",
          boxShadow: "-2px 0 12px rgba(0, 0, 0, 0.35)",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          fontSize: "clamp(0.45rem, 1.8vw, 0.58rem)",
          letterSpacing: "0.08em",
          lineHeight: 1.5,
        }}
      >
        Career ▶
      </button>

      <button
        type="button"
        className="osu-display-font"
        onClick={openActivitiesPanel}
        style={{
          position: "fixed",
          right: 0,
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 20,
          background: "#D73F09",
          color: "#FFFFFF",
          border: "none",
          borderTopLeftRadius: 10,
          borderBottomLeftRadius: 10,
          padding: "14px 10px",
          cursor: "pointer",
          boxShadow: "-2px 0 12px rgba(0, 0, 0, 0.35)",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          fontSize: "clamp(0.45rem, 1.8vw, 0.58rem)",
          letterSpacing: "0.08em",
          lineHeight: 1.5,
        }}
      >
        Activities ▶
      </button>

      <button
        type="button"
        className="osu-display-font"
        onClick={openShopPanel}
        style={{
          position: "fixed",
          right: 0,
          top: "calc(50% + 108px)",
          transform: "translateY(-50%)",
          zIndex: 20,
          background: "#1D9E75",
          color: "#FFFFFF",
          border: "none",
          borderTopLeftRadius: 10,
          borderBottomLeftRadius: 10,
          padding: "14px 10px",
          cursor: "pointer",
          boxShadow: "-2px 0 12px rgba(0, 0, 0, 0.35)",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          fontSize: "clamp(0.45rem, 1.8vw, 0.58rem)",
          letterSpacing: "0.08em",
          lineHeight: 1.5,
        }}
      >
        Shop ▶
      </button>

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
            fontSize: "clamp(0.45rem, 2vw, 0.62rem)",
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
          }}
        >
          <h2
            className="osu-display-font"
            style={{
              margin: "0 0 12px",
              fontSize: "clamp(0.55rem, 2.2vw, 0.75rem)",
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
                fontSize: "clamp(0.42rem, 1.8vw, 0.55rem)",
              }}
            >
              Quit current job
            </button>
          ) : null}
          {JOBS.filter((job) => jobIsAvailable(job, currentYear)).map((job) => {
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
                    fontSize: "clamp(0.48rem, 2vw, 0.62rem)",
                    color: "#FFFFFF",
                    marginBottom: 4,
                  }}
                >
                  {job.name}
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.38rem, 1.5vw, 0.5rem)",
                    opacity: 0.85,
                    marginBottom: 6,
                  }}
                >
                  {job.location} · {job.epCost} EP/wk · ${job.weeklyPay}/wk
                </div>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "clamp(0.36rem, 1.45vw, 0.48rem)",
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
                  onClick={() => setActiveJobId(job.id)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: isCurrent ? "rgba(29,158,117,0.35)" : "#D73F09",
                    color: "#FFFFFF",
                    cursor: isCurrent ? "default" : "pointer",
                    fontSize: "clamp(0.4rem, 1.6vw, 0.52rem)",
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
            fontSize: "clamp(0.45rem, 2vw, 0.62rem)",
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
          }}
        >
          <h2
            className="osu-display-font"
            style={{
              margin: "0 0 12px",
              fontSize: "clamp(0.55rem, 2.2vw, 0.75rem)",
              color: "#FFFFFF",
            }}
          >
            Shop
          </h2>
          {shopMainItems.map((item) => {
            const ownedOngoing = !item.isOneTime && ownedShopIds.includes(item.id);
            const canAfford = money >= item.cost;
            const canBuy = canAfford && !ownedOngoing;
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
                      fontSize: "clamp(0.48rem, 2vw, 0.62rem)",
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
                        fontSize: "clamp(0.34rem, 1.3vw, 0.44rem)",
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
                    fontSize: "clamp(0.36rem, 1.45vw, 0.48rem)",
                    lineHeight: 1.45,
                    opacity: 0.9,
                  }}
                >
                  {item.description}
                </p>
                <div
                  style={{
                    fontSize: "clamp(0.36rem, 1.45vw, 0.48rem)",
                    marginBottom: 6,
                    color: "#1D9E75",
                    fontWeight: 700,
                  }}
                >
                  ${item.cost}
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.34rem, 1.35vw, 0.46rem)",
                    marginBottom: 8,
                    opacity: 0.88,
                  }}
                >
                  Now: {formatStatDelta(item.effect)}
                  {!item.isOneTime && item.weeklyBonus ? (
                    <>
                      {" "}
                      · Weekly: {formatStatDelta(item.weeklyBonus)}
                    </>
                  ) : null}
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
                    background: !canBuy ? "rgba(120,120,120,0.35)" : "#1D9E75",
                    color: "#FFFFFF",
                    cursor: !canBuy ? "not-allowed" : "pointer",
                    fontSize: "clamp(0.4rem, 1.6vw, 0.52rem)",
                  }}
                >
                  {ownedOngoing ? "Owned" : canAfford ? "Buy" : "Cannot afford"}
                </button>
              </div>
            );
          })}

          <h3
            className="osu-display-font"
            style={{
              margin: "20px 0 10px",
              fontSize: "clamp(0.5rem, 2vw, 0.65rem)",
              color: "#FCA5A5",
            }}
          >
            Underground market
          </h3>
          <p
            style={{
              margin: "0 0 12px",
              fontSize: "clamp(0.34rem, 1.35vw, 0.46rem)",
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
            return (
              <div
                key={item.id}
                style={{
                  marginBottom: 12,
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(127, 29, 29, 0.12)",
                  border: "1px solid rgba(248, 113, 113, 0.35)",
                  opacity: canAfford ? 1 : 0.45,
                }}
              >
                <div
                  className="osu-display-font"
                  style={{
                    fontSize: "clamp(0.48rem, 2vw, 0.62rem)",
                    color: "#FECACA",
                    marginBottom: 6,
                  }}
                >
                  {item.name}
                </div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "clamp(0.36rem, 1.45vw, 0.48rem)",
                    lineHeight: 1.45,
                    color: "#FEE2E2",
                  }}
                >
                  {item.description}
                </p>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "clamp(0.34rem, 1.35vw, 0.46rem)",
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
                    fontSize: "clamp(0.36rem, 1.45vw, 0.48rem)",
                    marginBottom: 6,
                    color: "#F87171",
                    fontWeight: 700,
                  }}
                >
                  ${item.cost}
                </div>
                <div
                  style={{
                    fontSize: "clamp(0.34rem, 1.35vw, 0.46rem)",
                    marginBottom: 8,
                    opacity: 0.9,
                    color: "#FEE2E2",
                  }}
                >
                  Instant: {formatStatDelta(item.effect)}
                </div>
                <button
                  type="button"
                  className="osu-display-font"
                  disabled={!canAfford}
                  onClick={() => buyShopItem(item.id)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "none",
                    background: !canAfford ? "rgba(120,120,120,0.35)" : "#B91C1C",
                    color: "#FFFFFF",
                    cursor: !canAfford ? "not-allowed" : "pointer",
                    fontSize: "clamp(0.4rem, 1.6vw, 0.52rem)",
                  }}
                >
                  {canAfford ? "Buy (confirm risk)" : "Cannot afford"}
                </button>
              </div>
            );
          })}
        </div>
      </aside>

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
