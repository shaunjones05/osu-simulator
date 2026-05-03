"use client";

import type { CSSProperties, ReactNode } from "react";
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

export type CutsceneExtraEvent = {
  title: string;
  description: string;
};

export type CutsceneScreenProps = {
  isLoading: boolean;
  storyText: string;
  sceneImage: string;
  week: number;
  year: number;
  statsBefore: WeekStats;
  statsAfter: WeekStats;
  extraEvent: CutsceneExtraEvent | null;
  /** Short labels for the week’s activities, e.g. "Study x2", "Gym". */
  activityChips: string[];
  onContinue: () => void;
};

export default function CutsceneScreen({
  isLoading,
  storyText,
  sceneImage,
  week,
  year,
  statsBefore,
  statsAfter,
  extraEvent,
  activityChips,
  onContinue,
}: CutsceneScreenProps) {
  const baseFont =
    'var(--font-body), Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  if (isLoading) {
    const outer: CSSProperties = {
      position: "fixed",
      inset: 0,
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
      zIndex: 100,
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

  const hasScene = sceneImage.trim().length > 0;

  const chipStyle: CSSProperties = {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 20,
    backgroundColor: ORANGE,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.35,
    fontFamily: baseFont,
  };

  const storyStyle: CSSProperties = {
    color: "rgba(255, 255, 255, 0.92)",
    fontSize: "1.05rem",
    lineHeight: 1.65,
    marginBottom: "1.25rem",
    fontFamily: baseFont,
  };

  const eventBox: CSSProperties = {
    marginBottom: "1.25rem",
    padding: "1rem 1.1rem",
    borderRadius: 10,
    border: `1px solid ${ORANGE}`,
    backgroundColor: "rgba(215, 63, 9, 0.12)",
  };

  const eventLabel: CSSProperties = {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: ORANGE,
    fontWeight: 700,
    marginBottom: "0.5rem",
    fontFamily: baseFont,
  };

  const eventDesc: CSSProperties = {
    fontSize: "0.9rem",
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 1.5,
    fontFamily: baseFont,
  };

  const statRow: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    padding: "0.55rem 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
    fontSize: "0.95rem",
    fontFamily: baseFont,
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
    maxWidth: 480,
    margin: "0 auto",
    display: "block",
    padding: "0.95rem 1rem",
    fontSize: "1rem",
    fontWeight: 700,
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    backgroundColor: ORANGE,
    color: "#FFFFFF",
    fontFamily: baseFont,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        margin: 0,
        boxSizing: "border-box",
        backgroundColor: "#000",
        zIndex: 40,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: "100%",
          height: "50vh",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "#0d0d0d",
        }}
      >
        {hasScene ? (
          /* eslint-disable-next-line @next/next/no-img-element -- pixel art needs native img + image-rendering */
          <img
            src={`/scenes/${sceneImage.trim()}`}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
              imageRendering: "pixelated",
            }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)",
            }}
          />
        )}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: "50vh",
          width: "100%",
          boxSizing: "border-box",
          backgroundColor: BG,
          color: "#FFFFFF",
          padding: "1rem 1.25rem 1.5rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          fontFamily: baseFont,
        }}
      >
        <div
          className="osu-display-font osu-display-font--micro"
          style={{
            fontSize: 12,
            color: "rgba(255, 255, 255, 0.55)",
            marginBottom: "0.75rem",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Year {year} · Week {week}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          {activityChips.length > 0
            ? activityChips.map((label, i) => (
                <span key={`${label}-${i}`} style={chipStyle}>
                  {label}
                </span>
              ))
            : null}
        </div>

        <p style={{ ...storyStyle, textAlign: "left", flexShrink: 0 }}>
          {storyText}
        </p>

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

        <div style={{ marginBottom: "1.25rem", flexShrink: 0 }}>
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

        <div style={{ marginTop: "auto", paddingTop: 8 }}>
          <button type="button" style={btn} onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
