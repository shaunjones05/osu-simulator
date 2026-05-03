"use client";

import type { CSSProperties, ReactNode } from "react";
import { ACTIVITIES } from "../lib/gameData.js";
import type { WeekStats } from "./WeekSummary";

const ORANGE = "#D73F09";
const BG = "#1A1A1A";

const STAT_KEYS: (keyof WeekStats)[] = [
  "gpa",
  "health",
  "happiness",
  "social",
];

const STAT_LABELS: Record<keyof WeekStats, string> = {
  gpa: "GPA",
  health: "Health",
  happiness: "Happiness",
  social: "Social",
};

/** First segment of location (before comma) for readable prose. */
function locationLead(location: string): string {
  const i = location.indexOf(",");
  return (i >= 0 ? location.slice(0, i) : location).trim();
}

function repeatSuffix(count: number): string {
  if (count <= 1) return "";
  if (count === 2) return " twice";
  if (count === 3) return " three times";
  return ` ${count} times`;
}

/**
 * One sentence summarizing the week's activity picks (no AI).
 */
export function buildWeekActivitySummary(selectionIds: string[]): string {
  if (!selectionIds.length) {
    return "This week you didn't schedule any activities.";
  }

  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const id of selectionIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
    if (!order.includes(id)) order.push(id);
  }

  const clauses = order.map((id) => {
    const n = counts.get(id) ?? 1;
    const a = ACTIVITIES.find((x) => x.id === id);
    if (!a) {
      return `did something${repeatSuffix(n)}`;
    }
    const loc = locationLead(a.location);
    const suf = repeatSuffix(n);

    switch (id) {
      case "study-valley-library":
        return `studied at ${loc}${suf}`;
      case "gym-dixon-rec":
        return `hit the gym at ${loc}${suf}`;
      case "frat-party-26th":
        return `went to a party on 26th St${suf}`;
      case "football-reser":
        return `went to a football game at ${loc}${suf}`;
      case "eat-arnold-dining":
        return `ate at ${loc}${suf}`;
      case "sleep-in":
        return `slept in${suf}`;
      case "club-mu":
        return `joined a club at ${loc}${suf}`;
      case "study-group-kelley":
        return `had a study group at ${loc}${suf}`;
      default:
        return `${a.name.toLowerCase()} at ${loc}${suf}`;
    }
  });

  if (clauses.length === 1) {
    return `This week you ${clauses[0]}.`;
  }
  if (clauses.length === 2) {
    return `This week you ${clauses[0]} and ${clauses[1]}.`;
  }
  const head = clauses.slice(0, -1).join(", ");
  const tail = clauses[clauses.length - 1];
  return `This week you ${head}, and ${tail}.`;
}

export type CutsceneExtraEvent = {
  title: string;
  description: string;
};

export type CutsceneScreenProps = {
  isLoading: boolean;
  sceneImage: string;
  week: number;
  year: number;
  statsBefore: WeekStats;
  statsAfter: WeekStats;
  extraEvent: CutsceneExtraEvent | null;
  weekSelections: string[];
  onContinue: () => void;
};

export default function CutsceneScreen({
  isLoading,
  sceneImage,
  week,
  year,
  statsBefore,
  statsAfter,
  extraEvent,
  weekSelections,
  onContinue,
}: CutsceneScreenProps) {
  const baseFont =
    'var(--font-body), Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  if (isLoading) {
    const outer: CSSProperties = {
      minHeight: "100vh",
      width: "100%",
      margin: 0,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: BG,
      color: "#FFFFFF",
      padding: 24,
    };

    return (
      <div style={outer}>
        <p
          className="osu-display-font osu-display-font--hero osu-simming-pulse"
          style={{
            textAlign: "center",
            maxWidth: "min(90vw, 28rem)",
          }}
        >
          Simming to next week...
        </p>
      </div>
    );
  }

  const shell: CSSProperties = {
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: BG,
    color: "#FFFFFF",
    padding: "1.25rem",
    paddingBottom: "2rem",
    fontFamily: baseFont,
  };

  const inner: CSSProperties = {
    maxWidth: "640px",
    margin: "0 auto",
  };

  const meta: CSSProperties = {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.65)",
    marginBottom: "0.75rem",
    fontWeight: 600,
  };

  const imgWrap: CSSProperties = {
    width: "100%",
    marginBottom: "1.25rem",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    backgroundColor: "#0d0d0d",
    display: "flex",
    lineHeight: 0,
  };

  const summaryStyle: CSSProperties = {
    color: "rgba(255, 255, 255, 0.88)",
    fontSize: "1rem",
    lineHeight: 1.65,
    marginBottom: "1.25rem",
  };

  const eventBox: CSSProperties = {
    marginBottom: "1.35rem",
    padding: "1rem 1.1rem",
    borderRadius: "8px",
    border: `1px solid ${ORANGE}`,
    backgroundColor: "rgba(215, 63, 9, 0.12)",
  };

  const eventLabel: CSSProperties = {
    fontSize: "0.72rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: ORANGE,
    fontWeight: 700,
    marginBottom: "0.5rem",
  };

  const eventDesc: CSSProperties = {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.82)",
    lineHeight: 1.5,
  };

  const statsBlock: CSSProperties = {
    marginBottom: "1.5rem",
  };

  const statRow: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.55rem 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    fontSize: "0.95rem",
  };

  const statLabel: CSSProperties = {
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: 600,
  };

  const deltaUp: CSSProperties = {
    color: "#22c55e",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  };

  const deltaDown: CSSProperties = {
    color: "#ef4444",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  };

  const deltaZero: CSSProperties = {
    color: "rgba(255, 255, 255, 0.4)",
    fontVariantNumeric: "tabular-nums",
  };

  const btn: CSSProperties = {
    width: "100%",
    padding: "0.9rem 1rem",
    fontSize: "1rem",
    fontWeight: 700,
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: ORANGE,
    color: "#FFFFFF",
    fontFamily: baseFont,
  };

  const hasScene = sceneImage.trim().length > 0;
  const activitySummary = buildWeekActivitySummary(weekSelections);

  return (
    <div style={shell}>
      <div style={inner}>
        <div
          className="osu-display-font osu-display-font--micro"
          style={meta}
        >
          Year {year} · Week {week}
        </div>

        {hasScene ? (
          <div style={imgWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element -- pixel art needs native img + image-rendering */}
            <img
              src={`/scenes/${sceneImage.trim()}`}
              alt=""
              style={{ imageRendering: "pixelated", width: "100%" }}
            />
          </div>
        ) : null}

        <p style={summaryStyle}>{activitySummary}</p>

        {extraEvent ? (
          <div style={eventBox}>
            <div style={eventLabel}>This week at OSU:</div>
            <div
              className="osu-display-font osu-display-font--title"
              style={{ marginBottom: "0.45rem", color: "#FFFFFF" }}
            >
              {extraEvent.title}
            </div>
            <div style={eventDesc}>{extraEvent.description}</div>
          </div>
        ) : null}

        <div style={statsBlock}>
          {STAT_KEYS.map((key) => {
            const before = Math.round(Number(statsBefore[key]) || 0);
            const after = Math.round(Number(statsAfter[key]) || 0);
            const delta = after - before;
            let changeEl: ReactNode;
            if (delta > 0) {
              changeEl = <span style={deltaUp}>+{delta}</span>;
            } else if (delta < 0) {
              changeEl = <span style={deltaDown}>{delta}</span>;
            } else {
              changeEl = <span style={deltaZero}>0</span>;
            }

            return (
              <div key={key} style={statRow}>
                <span style={statLabel}>{STAT_LABELS[key]}</span>
                {changeEl}
              </div>
            );
          })}
        </div>

        <button type="button" style={btn} onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  );
}
