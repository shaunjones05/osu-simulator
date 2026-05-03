"use client";

import { Press_Start_2P } from "next/font/google";
import type { CSSProperties } from "react";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

export type GraduationStats = {
  gpa: number;
  health: number;
  happiness: number;
  social: number;
  attractiveness: number;
};

export type GraduationEnding = {
  title: string;
  description: string;
  color: string;
};

const STAT_ORDER: (keyof GraduationStats)[] = [
  "gpa",
  "health",
  "happiness",
  "social",
  "attractiveness",
];

const STAT_LABELS: Record<keyof GraduationStats, string> = {
  gpa: "GPA",
  health: "Health",
  happiness: "Happiness",
  social: "Social",
  attractiveness: "Looks",
};

const BAR_COLORS: Record<keyof GraduationStats, string> = {
  gpa: "#D73F09",
  health: "#1D9E75",
  happiness: "#378ADD",
  social: "#7F77DD",
  attractiveness: "#E91E8C",
};

const ORANGE = "#D73F09";
const BG = "#0f0e0c";

function clamp100(n: number): number {
  return Math.min(100, Math.max(0, n));
}

function formatStatValue(key: keyof GraduationStats, raw: number): string {
  const v = clamp100(raw);
  if (key === "gpa") return (v / 25).toFixed(1);
  return String(Math.round(v));
}

export type GraduationScreenProps = {
  playerName: string;
  ending: GraduationEnding | null;
  aiEndingText: string;
  finalStats: GraduationStats;
  onRestart: () => void;
};

export default function GraduationScreen({
  playerName,
  ending,
  aiEndingText,
  finalStats,
  onRestart,
}: GraduationScreenProps) {
  const displayName = playerName.trim() || "Beaver";

  const outer: CSSProperties = {
    minHeight: "100vh",
    margin: 0,
    boxSizing: "border-box",
    padding: "28px 20px 40px",
    background: `radial-gradient(ellipse 100% 70% at 50% -10%, rgba(215, 63, 9, 0.28) 0%, transparent 50%), radial-gradient(ellipse 80% 50% at 100% 100%, rgba(215, 63, 9, 0.12) 0%, transparent 45%), ${BG}`,
    color: "#fafaf9",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const panel: CSSProperties = {
    width: "100%",
    maxWidth: "560px",
    backgroundColor: "rgba(22, 20, 18, 0.92)",
    borderRadius: "16px",
    border: `1px solid rgba(215, 63, 9, 0.45)`,
    boxShadow:
      "0 0 0 1px rgba(0,0,0,0.4), 0 28px 56px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
    padding: "36px 28px 32px",
    textAlign: "center",
  };

  const congrats: CSSProperties = {
    margin: "0 0 8px",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "rgba(215, 63, 9, 0.95)",
  };

  const nameStyle: CSSProperties = {
    margin: "0 0 28px",
    fontSize: "clamp(1.65rem, 5vw, 2.35rem)",
    fontWeight: 800,
    lineHeight: 1.2,
    color: "#fff",
    textShadow: "0 2px 24px rgba(215, 63, 9, 0.25)",
  };

  const endingTitle: CSSProperties = {
    margin: "0 0 16px",
    fontSize: "clamp(1.1rem, 3.5vw, 1.65rem)",
    lineHeight: 1.45,
    letterSpacing: "0.02em",
  };

  const endingDesc: CSSProperties = {
    margin: "0 0 28px",
    fontSize: "1.05rem",
    lineHeight: 1.65,
    color: "rgba(255,255,255,0.82)",
    textAlign: "left",
  };

  const aiBlock: CSSProperties = {
    margin: "0 0 28px",
    padding: "20px 20px 22px",
    borderRadius: "12px",
    background:
      "linear-gradient(145deg, rgba(215,63,9,0.18) 0%, rgba(0,0,0,0.35) 100%)",
    border: "1px solid rgba(215, 63, 9, 0.4)",
    fontSize: "1.08rem",
    lineHeight: 1.65,
    color: "#fff7ed",
    textAlign: "left",
    fontWeight: 500,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
  };

  const aiLabel: CSSProperties = {
    display: "block",
    marginBottom: "12px",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: ORANGE,
  };

  const fallback: CSSProperties = {
    margin: "0 0 28px",
    fontSize: "1rem",
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.65)",
    fontStyle: "italic",
  };

  const reportLabel: CSSProperties = {
    margin: "0 0 14px",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "rgba(215, 63, 9, 0.9)",
  };

  const reportCard: CSSProperties = {
    textAlign: "left",
    backgroundColor: "rgba(0,0,0,0.38)",
    borderRadius: "12px",
    border: "1px solid rgba(215, 63, 9, 0.22)",
    padding: "6px 4px 4px",
    marginBottom: "28px",
    position: "relative",
    overflow: "hidden",
  };

  const reportRibbon: CSSProperties = {
    height: 4,
    borderRadius: "12px 12px 0 0",
    background: `linear-gradient(90deg, ${ORANGE}, #ff8c42, ${ORANGE})`,
    margin: "-6px -4px 12px",
    opacity: 0.95,
  };

  const statRow: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontSize: "1rem",
  };

  const statRowLast: CSSProperties = {
    ...statRow,
    borderBottom: "none",
  };

  const dot: CSSProperties = {
    width: 9,
    height: 9,
    borderRadius: "50%",
    marginRight: 12,
    flexShrink: 0,
  };

  const button: CSSProperties = {
    width: "100%",
    padding: "16px 22px",
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#fff",
    backgroundColor: ORANGE,
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 6px 22px rgba(215, 63, 9, 0.45)",
  };

  const customTrimmed = aiEndingText.trim();
  const showAiEnding = ending === null && customTrimmed.length > 0;
  const showFallback = ending === null && customTrimmed.length === 0;

  return (
    <div style={outer}>
      <div style={panel}>
        <p style={congrats}>Congratulations</p>
        <h1 style={nameStyle}>{displayName}</h1>

        {ending !== null ? (
          <>
            <h2
              className={pixel.className}
              style={{
                ...endingTitle,
                color: ending.color,
                textShadow: `0 0 28px ${ending.color}55`,
              }}
            >
              {ending.title}
            </h2>
            <p style={endingDesc}>{ending.description}</p>
          </>
        ) : null}

        {showAiEnding ? (
          <div style={aiBlock}>
            <span style={aiLabel}>Your OSU story</span>
            {customTrimmed}
          </div>
        ) : null}

        {showFallback ? (
          <p style={fallback}>
            Your path did not match a classic ending — the quad remembers you
            all the same.
          </p>
        ) : null}

        <p style={reportLabel}>Graduation report card</p>
        <div style={reportCard}>
          <div style={reportRibbon} aria-hidden />
          {STAT_ORDER.map((key, i) => {
            const rowStyle = i === STAT_ORDER.length - 1 ? statRowLast : statRow;
            return (
              <div key={key} style={rowStyle}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: "#e7e5e4",
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{ ...dot, backgroundColor: BAR_COLORS[key] }}
                    aria-hidden
                  />
                  {STAT_LABELS[key]}
                </span>
                <span
                  style={{
                    color: "#fff",
                    fontVariantNumeric: "tabular-nums",
                    fontWeight: 800,
                    fontSize: "1.05rem",
                  }}
                >
                  {formatStatValue(key, Number(finalStats[key]) || 0)}
                </span>
              </div>
            );
          })}
        </div>

        <button type="button" style={button} onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}
