"use client";

import type { CSSProperties, ReactNode } from "react";

export type WeekStats = {
  gpa: number;
  health: number;
  happiness: number;
  social: number;
};

const STAT_KEYS: (keyof WeekStats)[] = ["gpa", "health", "happiness", "social"];

const STAT_LABELS: Record<keyof WeekStats, string> = {
  gpa: "GPA",
  health: "Health",
  happiness: "Happiness",
  social: "Social",
};

export type WeekSummaryProps = {
  week: number;
  year: number;
  statsBefore: WeekStats;
  statsAfter: WeekStats;
  storyText: string;
  onContinue: () => void;
};

const PLACEHOLDER_STORY =
  "Your week will appear here once the story is generated.";

export default function WeekSummary({
  week,
  year,
  statsBefore,
  statsAfter,
  storyText,
  onContinue,
}: WeekSummaryProps) {
  const displayStory =
    storyText.trim().length > 0 ? storyText : PLACEHOLDER_STORY;

  const root: CSSProperties = {
    backgroundColor: "#1A1A1A",
    color: "#fff",
    padding: "1.5rem",
    borderRadius: "8px",
    maxWidth: "560px",
    margin: "0 auto",
  };

  const header: CSSProperties = {
    fontSize: "1.35rem",
    fontWeight: 700,
    marginBottom: "1.25rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #333",
    color: "#fff",
  };

  const storyBox: CSSProperties = {
    fontStyle: "italic",
    color: "#9ca3af",
    backgroundColor: "#252525",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "1rem 1.15rem",
    marginBottom: "1.35rem",
    lineHeight: 1.55,
    fontSize: "0.95rem",
  };

  const statsSection: CSSProperties = {
    marginBottom: "1.5rem",
  };

  const statRow: CSSProperties = {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "0.75rem",
    padding: "0.55rem 0",
    borderBottom: "1px solid #2a2a2a",
    fontSize: "1rem",
  };

  const statLabel: CSSProperties = {
    color: "#d1d5db",
    fontWeight: 600,
  };

  const statValueWrap: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  };

  const statValue: CSSProperties = {
    color: "#fff",
    fontVariantNumeric: "tabular-nums",
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

  const button: CSSProperties = {
    width: "100%",
    padding: "0.85rem 1rem",
    fontSize: "1rem",
    fontWeight: 600,
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    backgroundColor: "#D73F09",
    color: "#fff",
  };

  return (
    <div style={root}>
      <header style={header}>
        Week {week} — Year {year} Complete
      </header>

      <div style={storyBox}>{displayStory}</div>

      <div style={statsSection}>
        {STAT_KEYS.map((key) => {
          const before = Number(statsBefore[key]) || 0;
          const after = Number(statsAfter[key]) || 0;
          const delta = Math.round(after - before);
          let deltaEl: ReactNode = null;
          if (delta > 0) {
            deltaEl = <span style={deltaUp}>+{delta}</span>;
          } else if (delta < 0) {
            deltaEl = <span style={deltaDown}>{delta}</span>;
          }

          return (
            <div key={key} style={statRow}>
              <span style={statLabel}>{STAT_LABELS[key]}</span>
              <div style={statValueWrap}>
                <span style={statValue}>{after}</span>
                {deltaEl}
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" style={button} onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
