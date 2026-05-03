"use client";

import { Press_Start_2P } from "next/font/google";
import type { CSSProperties } from "react";

const pixel = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
});

export type GameOverStats = {
  gpa: number;
  health: number;
  happiness: number;
  social: number;
  attractiveness: number;
};

const STAT_ORDER: (keyof GameOverStats)[] = [
  "gpa",
  "health",
  "happiness",
  "social",
  "attractiveness",
];

const STAT_LABELS: Record<keyof GameOverStats, string> = {
  gpa: "GPA",
  health: "Health",
  happiness: "Happiness",
  social: "Social",
  attractiveness: "Looks",
};

const BAR_COLORS: Record<keyof GameOverStats, string> = {
  gpa: "#D73F09",
  health: "#1D9E75",
  happiness: "#378ADD",
  social: "#7F77DD",
  attractiveness: "#E91E8C",
};

function clamp100(n: number): number {
  return Math.min(100, Math.max(0, n));
}

function formatStatValue(key: keyof GameOverStats, raw: number): string {
  const v = clamp100(raw);
  if (key === "gpa") return (v / 25).toFixed(1);
  return String(Math.round(v));
}

export type GameOverProps = {
  reason: string;
  week: number;
  year: number;
  finalStats: GameOverStats;
  onRestart: () => void;
};

const BG = "#0d0b0c";
const CARD = "#161214";
const BORDER = "rgba(220, 38, 38, 0.35)";

export default function GameOver({
  reason,
  week,
  year,
  finalStats,
  onRestart,
}: GameOverProps) {
  const outer: CSSProperties = {
    minHeight: "100vh",
    margin: 0,
    boxSizing: "border-box",
    padding: "28px 20px 40px",
    background: `radial-gradient(ellipse 120% 80% at 50% 0%, rgba(127, 29, 29, 0.35) 0%, transparent 55%), ${BG}`,
    color: "#e7e5e4",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const panel: CSSProperties = {
    width: "100%",
    maxWidth: "520px",
    backgroundColor: CARD,
    borderRadius: "14px",
    border: `1px solid ${BORDER}`,
    boxShadow:
      "0 0 0 1px rgba(0,0,0,0.5), 0 24px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
    padding: "32px 28px 28px",
    textAlign: "center",
  };

  const gameOverTitle: CSSProperties = {
    margin: "0 0 20px",
    fontSize: "clamp(1.35rem, 4.5vw, 2rem)",
    lineHeight: 1.35,
    color: "#f87171",
    textShadow:
      "0 0 24px rgba(248, 113, 113, 0.45), 0 2px 0 rgba(0,0,0,0.8)",
    letterSpacing: "0.04em",
  };

  const reasonStyle: CSSProperties = {
    margin: "0 0 24px",
    fontSize: "1.05rem",
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.88)",
    fontWeight: 500,
  };

  const meta: CSSProperties = {
    margin: "0 0 28px",
    fontSize: "0.95rem",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: "0.02em",
  };

  const statsHeading: CSSProperties = {
    margin: "0 0 14px",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "rgba(248, 113, 113, 0.75)",
  };

  const statsCard: CSSProperties = {
    textAlign: "left",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "14px 16px",
    marginBottom: "26px",
  };

  const statRow: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontSize: "0.95rem",
  };

  const statRowLast: CSSProperties = {
    ...statRow,
    borderBottom: "none",
    paddingBottom: 0,
  };

  const dot: CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    marginRight: 10,
    flexShrink: 0,
  };

  const button: CSSProperties = {
    width: "100%",
    padding: "14px 20px",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#fff",
    background:
      "linear-gradient(180deg, rgba(248,113,113,0.95) 0%, #b91c1c 100%)",
    border: "1px solid rgba(248, 113, 113, 0.5)",
    borderRadius: "10px",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(185, 28, 28, 0.35)",
  };

  return (
    <div style={outer}>
      <div style={panel}>
        <h1 className={pixel.className} style={gameOverTitle}>
          GAME OVER
        </h1>
        <p style={reasonStyle}>{reason}</p>
        <p style={meta}>
          Made it to Year {year}, Week {week}
        </p>

        <p style={statsHeading}>Final status</p>
        <div style={statsCard}>
          {STAT_ORDER.map((key, i) => {
            const rowStyle = i === STAT_ORDER.length - 1 ? statRowLast : statRow;
            return (
              <div key={key} style={rowStyle}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: "#d6d3d1",
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
                    fontWeight: 700,
                  }}
                >
                  {formatStatValue(key, Number(finalStats[key]) || 0)}
                </span>
              </div>
            );
          })}
        </div>

        <button type="button" style={button} onClick={onRestart}>
          Try Again
        </button>
      </div>
    </div>
  );
}
