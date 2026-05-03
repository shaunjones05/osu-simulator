"use client";

import React, { useState } from "react";
import {
  ACTIVITIES,
  INITIAL_STATS,
  ENERGY_BY_YEAR,
  getSpecialEvent,
  getRandEvent,
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

const STAT_KEYS = ["gpa", "health", "happiness", "social"] as const;

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
  ) {
    let s: WeekStats = normalizeWeekStats(
      applyWeek(statsBefore, selections, ACTIVITIES),
    );
    s = normalizeWeekStats(applyPassiveEffects(s));

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
      extra = { title: rand.title, description: rand.description };
      s = normalizeWeekStats(applyStatDelta(s, rand.effect));
    }

    const finalStats = normalizeWeekStats(s);
    const sceneFile = pickSceneImageFromSelections(selections);

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
      );
      apiScenario = null;
    }

    return {
      finalStats,
      story,
      sceneFile,
      extra,
      apiScenario,
    };
  }

  function handleActivityConfirm() {
    const statsBefore: WeekStats = { ...stats };
    const selections = [...weekSelections];
    const year = currentYear;
    const week = currentWeek;
    const baseline = { ...week1BaselineStats };
    const name = playerName;

    setIsGeneratingStory(true);
    setActivitiesPanelOpen(false);
    setPendingApiScenario(null);
    setGamePhase("cutscene");

    void (async () => {
      const { finalStats, story, sceneFile, extra, apiScenario } =
        await resolveWeekEnd(
          statsBefore,
          selections,
          year,
          week,
          baseline,
          name,
          usedScenarioIds,
        );

      setPendingApiScenario(apiScenario);
      setStoryText(story);
      setSceneImageFilename(sceneFile);
      setCutsceneExtraEvent(extra);
      setCutsceneStatsBefore(statsBefore);
      setCutsceneStatsAfter(finalStats);
      setStats(finalStats);
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
    if (pendingApiScenario) {
      setActiveScenario(pendingApiScenario);
      setPendingApiScenario(null);
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

      <button
        type="button"
        className="osu-display-font"
        onClick={() => setActivitiesPanelOpen(true)}
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
              if (activity && energyRemaining >= activity.epCost) {
                setWeekSelections([...weekSelections, id]);
                setEnergyRemaining(energyRemaining - activity.epCost);
              }
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
    </>
  );
}
