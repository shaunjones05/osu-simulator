"use client";

import type { CSSProperties, ReactNode } from "react";
import { Press_Start_2P } from "next/font/google";
import type { WeekStats } from "./WeekSummary";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

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
  onContinue,
}: CutsceneScreenProps) {
  const baseFont =
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

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

    const loadingText: CSSProperties = {
      fontSize: "clamp(0.65rem, 2.5vw, 1rem)",
      lineHeight: 1.6,
      textAlign: "center",
      maxWidth: "min(90vw, 28rem)",
    };

    return (
      <>
        <style>{`
          @keyframes cutscene-loading-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.42; }
          }
          .cutscene-loading-pulse {
            animation: cutscene-loading-pulse 1.25s ease-in-out infinite;
          }
        `}</style>
        <div style={outer}>
          <p
            className={`${pixelFont.className} cutscene-loading-pulse`}
            style={loadingText}
          >
            Simming to next week...
          </p>
        </div>
      </>
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
  };

  const story: CSSProperties = {
    fontStyle: "italic",
    color: "rgba(255, 255, 255, 0.55)",
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

  const eventTitle: CSSProperties = {
    fontWeight: 700,
    fontSize: "1.05rem",
    color: "#FFFFFF",
    marginBottom: "0.45rem",
    lineHeight: 1.3,
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
  };

  const sceneSrc =
    sceneImage.trim().length > 0 ? `/scenes/${sceneImage}` : "";

  return (
    <div style={shell}>
      <div style={inner}>
        <div style={meta}>
          Year {year} · Week {week}
        </div>

        {sceneSrc ? (
          <div style={imgWrap}>
            {/* eslint-disable-next-line @next/next/no-img-element -- pixel art needs native img + image-rendering */}
            <img
              src={sceneSrc}
              alt=""
              style={{
                display: "block",
                width: "100%",
                height: "auto",
                imageRendering: "pixelated",
              }}
            />
          </div>
        ) : null}

        <p style={story}>{storyText}</p>

        {extraEvent ? (
          <div style={eventBox}>
            <div style={eventLabel}>This week at OSU:</div>
            <div style={eventTitle}>{extraEvent.title}</div>
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
