"use client";

import React, { useState } from "react";
import type { CSSProperties } from "react";
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
import StartScreen from "./components/StartScreen";
import StatBars from "./components/StatBars";
import ActivityPicker from "./components/ActivityPicker";
import CutsceneScreen, {
  type CutsceneExtraEvent,
} from "./components/CutsceneScreen";
import type { WeekStats } from "./components/WeekSummary";
import GameOver from "./components/GameOver";
import GraduationScreen, {
  type GraduationEnding,
} from "./components/GraduationScreen";

type GamePhase = "picking" | "cutscene" | "gameover" | "graduation";

const STAT_KEYS = ["gpa", "health", "happiness", "social"] as const;

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

/** Filename under `/public/scenes/` (e.g. `study-valley-library.png`). */
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
  return bestId ? `${bestId}.png` : "";
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

  const shell: CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#1A1A1A",
    color: "#FFFFFF",
    padding: 24,
    fontFamily:
      'var(--font-body), Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  const header: CSSProperties = {
    marginBottom: 24,
    borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
    paddingBottom: 16,
  };

  const titleRow: CSSProperties = {
    fontSize: "1.2rem",
    fontWeight: 700,
    marginBottom: 6,
  };

  const metaRow: CSSProperties = {
    opacity: 0.92,
  };

  async function resolveWeekEnd(
    statsBefore: WeekStats,
    selections: string[],
    year: number,
    week: number,
    baseline: WeekStats,
    name: string,
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

    const story = await generateCutscene(
      name,
      year,
      week,
      selections,
      finalStats,
      baseline,
    );

    return {
      finalStats,
      story,
      sceneFile,
      extra,
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
    setGamePhase("cutscene");

    void (async () => {
      const { finalStats, story, sceneFile, extra } = await resolveWeekEnd(
        statsBefore,
        selections,
        year,
        week,
        baseline,
        name,
      );

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

  async function handleCutsceneContinue() {
    if (currentWeek < 8) {
      setCurrentWeek((w) => w + 1);
      setWeekSelections([]);
      setGamePhase("picking");
      setEnergyRemaining(
        ENERGY_BY_YEAR[`year${currentYear}` as keyof typeof ENERGY_BY_YEAR],
      );
      return;
    }

    if (currentYear < 4) {
      const nextYear = currentYear + 1;
      setCurrentYear(nextYear);
      setCurrentWeek(1);
      setWeekSelections([]);
      setGamePhase("picking");
      setEnergyRemaining(
        ENERGY_BY_YEAR[`year${nextYear}` as keyof typeof ENERGY_BY_YEAR],
      );
      return;
    }

    const ending = getEnding(stats);
    if (ending !== null) {
      setFinalEnding(ending);
      setAiEndingText("");
      setGamePhase("graduation");
      return;
    }

    setFinalEnding(null);
    const text = await generateCustomEnding(playerName, stats);
    setAiEndingText(text);
    setGamePhase("graduation");
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

  return (
    <div style={shell}>
      <header style={header}>
        <div style={titleRow}>{playerName || "Player"}</div>
        <div
          className="osu-display-font osu-display-font--micro"
          style={metaRow}
        >
          Year {currentYear} · Week {currentWeek}
        </div>
      </header>
      <StatBars
        stats={stats}
        gpaAsNA={
          currentYear === 1 && currentWeek === 1 && gamePhase === "picking"
        }
      />
      <ActivityPicker
        activities={ACTIVITIES}
        energyRemaining={energyRemaining}
        totalEnergy={
          ENERGY_BY_YEAR[`year${currentYear}` as keyof typeof ENERGY_BY_YEAR]
        }
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
  );
}
