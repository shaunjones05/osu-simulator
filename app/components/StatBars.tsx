import type { CSSProperties } from "react";

export type StatBarsStats = {
  gpa: number;
  health: number;
  happiness: number;
  social: number;
  attractiveness: number;
};

export type StatBarsProps = {
  stats: StatBarsStats;
  /** When true, GPA shows "NA" and an empty bar (internal gpa can still be used for sim). */
  gpaAsNA?: boolean;
  /** Compact HUD (e.g. top-left corner): smaller type and bars. */
  compact?: boolean;
};

const TRACK_BG = "#333333";

const BAR_COLORS: Record<keyof StatBarsStats, string> = {
  gpa: "#D73F09",
  health: "#1D9E75",
  happiness: "#378ADD",
  social: "#7F77DD",
  attractiveness: "#E91E8C",
};

const LABELS: Record<keyof StatBarsStats, string> = {
  gpa: "GPA",
  health: "Health",
  happiness: "Happiness",
  social: "Social",
  attractiveness: "Looks",
};

const ORDER: (keyof StatBarsStats)[] = [
  "gpa",
  "health",
  "happiness",
  "social",
  "attractiveness",
];

const easeAll: CSSProperties = {
  transition: "all 0.4s ease",
};

function clamp100(n: number): number {
  return Math.min(100, Math.max(0, n));
}

export default function StatBars({
  stats,
  gpaAsNA = false,
  compact = false,
}: StatBarsProps) {
  const rowWrap: CSSProperties = {
    marginBottom: compact ? 8 : 16,
    ...easeAll,
  };

  const rowHeader: CSSProperties = {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: compact ? 4 : 6,
    fontFamily:
      'var(--font-body), Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: compact ? "12px" : "0.9rem",
    ...easeAll,
  };

  const labelStyle: CSSProperties = {
    color: "#FFFFFF",
    fontWeight: 600,
    fontSize: compact ? "12px" : undefined,
    ...easeAll,
  };

  const valueStyle: CSSProperties = {
    color: "rgba(255, 255, 255, 0.9)",
    fontVariantNumeric: "tabular-nums",
    fontSize: compact ? "12px" : undefined,
    ...easeAll,
  };

  const track: CSSProperties = {
    height: compact ? 8 : 10,
    borderRadius: 5,
    backgroundColor: TRACK_BG,
    overflow: "hidden",
    ...easeAll,
  };

  const fillBase: CSSProperties = {
    height: "100%",
    borderRadius: 5,
    width: "0%",
    ...easeAll,
  };

  const rootStyle: CSSProperties = {
    width: "100%",
    maxWidth: compact ? "100%" : 480,
    fontFamily:
      'var(--font-body), Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  return (
    <div style={rootStyle}>
      {ORDER.map((key) => {
        const raw = clamp100(stats[key]);
        const isGpaNA = key === "gpa" && gpaAsNA;
        const barWidth = isGpaNA ? 0 : raw;
        const fill: CSSProperties = {
          ...fillBase,
          width: `${barWidth}%`,
          backgroundColor: BAR_COLORS[key],
        };

        const displayValue =
          key === "gpa"
            ? isGpaNA
              ? "NA"
              : (raw / 25).toFixed(1)
            : String(Math.round(raw));

        return (
          <div key={key} style={rowWrap}>
            <div style={rowHeader}>
              <span style={labelStyle}>{LABELS[key]}</span>
              <span style={valueStyle}>{displayValue}</span>
            </div>
            <div style={track}>
              <div style={fill} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
