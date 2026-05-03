import type { CSSProperties } from "react";

export type StatBarsStats = {
  gpa: number;
  health: number;
  happiness: number;
  social: number;
};

export type StatBarsProps = {
  stats: StatBarsStats;
};

const TRACK_BG = "#333333";

const BAR_COLORS: Record<keyof StatBarsStats, string> = {
  gpa: "#D73F09",
  health: "#1D9E75",
  happiness: "#378ADD",
  social: "#7F77DD",
};

const LABELS: Record<keyof StatBarsStats, string> = {
  gpa: "GPA",
  health: "Health",
  happiness: "Happiness",
  social: "Social",
};

const ORDER: (keyof StatBarsStats)[] = [
  "gpa",
  "health",
  "happiness",
  "social",
];

const easeAll: CSSProperties = {
  transition: "all 0.4s ease",
};

function clamp100(n: number): number {
  return Math.min(100, Math.max(0, n));
}

export default function StatBars({ stats }: StatBarsProps) {
  const rowWrap: CSSProperties = {
    marginBottom: 16,
    ...easeAll,
  };

  const rowHeader: CSSProperties = {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 6,
    fontFamily:
      'var(--font-body), Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: "0.9rem",
    ...easeAll,
  };

  const labelStyle: CSSProperties = {
    color: "#FFFFFF",
    fontWeight: 600,
    ...easeAll,
  };

  const valueStyle: CSSProperties = {
    color: "rgba(255, 255, 255, 0.9)",
    fontVariantNumeric: "tabular-nums",
    ...easeAll,
  };

  const track: CSSProperties = {
    height: 10,
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

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 480,
        fontFamily:
          'var(--font-body), Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      {ORDER.map((key) => {
        const raw = clamp100(stats[key]);
        const fill: CSSProperties = {
          ...fillBase,
          width: `${raw}%`,
          backgroundColor: BAR_COLORS[key],
        };

        const displayValue =
          key === "gpa"
            ? (raw / 25).toFixed(1)
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
