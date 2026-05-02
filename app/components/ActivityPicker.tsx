"use client";

import type { CSSProperties } from "react";

export type Activity = {
  id: string;
  name: string;
  location: string;
  epCost: number;
  effects: {
    gpa: number;
    health: number;
    happiness: number;
    social: number;
  };
};

const EFFECT_LABELS: Record<keyof Activity["effects"], string> = {
  gpa: "GPA",
  health: "Health",
  happiness: "Happiness",
  social: "Social",
};

function formatEffectsSummary(effects: Activity["effects"]): string {
  const parts: string[] = [];
  (Object.keys(EFFECT_LABELS) as (keyof Activity["effects"])[]).forEach((key) => {
    const v = effects[key];
    if (v === 0) return;
    const sign = v > 0 ? "+" : "";
    parts.push(`${sign}${v} ${EFFECT_LABELS[key]}`);
  });
  return parts.length > 0 ? parts.join(", ") : "No stat change";
}

export type ActivityPickerProps = {
  activities: Activity[];
  energyRemaining: number;
  selectedActivities: string[];
  onSelect: (activityId: string) => void;
  onConfirm: () => void;
};

export default function ActivityPicker({
  activities,
  energyRemaining,
  selectedActivities,
  onSelect,
  onConfirm,
}: ActivityPickerProps) {
  const spentEp = selectedActivities.reduce((sum, id) => {
    const a = activities.find((act) => act.id === id);
    return sum + (a?.epCost ?? 0);
  }, 0);
  const totalEnergy = energyRemaining + spentEp;
  const mustSpendEp = energyRemaining === totalEnergy;

  const rootStyle: CSSProperties = {
    backgroundColor: "#1A1A1A",
    color: "#fff",
    padding: "1.25rem",
    borderRadius: "8px",
    maxWidth: "720px",
    margin: "0 auto",
  };

  const headerStyle: CSSProperties = {
    marginBottom: "1.25rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #333",
  };

  const epLabelStyle: CSSProperties = {
    fontSize: "0.75rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#aaa",
    marginBottom: "0.35rem",
  };

  const epValueStyle: CSSProperties = {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#D73F09",
    lineHeight: 1.1,
  };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "0.75rem",
    marginBottom: "1.25rem",
  };

  const footerStyle: CSSProperties = {
    marginTop: "0.5rem",
  };

  const buttonStyle: CSSProperties = {
    width: "100%",
    padding: "0.85rem 1rem",
    fontSize: "1rem",
    fontWeight: 600,
    border: "none",
    borderRadius: "6px",
    cursor: mustSpendEp ? "not-allowed" : "pointer",
    backgroundColor: mustSpendEp ? "#444" : "#D73F09",
    color: "#fff",
    opacity: mustSpendEp ? 0.6 : 1,
  };

  return (
    <div style={rootStyle}>
      <header style={headerStyle}>
        <div style={epLabelStyle}>Energy remaining this week</div>
        <div style={epValueStyle}>{energyRemaining} EP</div>
      </header>

      <div style={gridStyle}>
        {activities.map((activity) => {
          const selected = selectedActivities.includes(activity.id);
          const cannotAfford = !selected && activity.epCost > energyRemaining;
          const dimmed = cannotAfford;

          const cardStyle: CSSProperties = {
            width: "100%",
            padding: "1rem",
            borderRadius: "8px",
            border: selected ? "2px solid #D73F09" : "2px solid #333",
            backgroundColor: selected ? "rgba(215, 63, 9, 0.18)" : "#252525",
            opacity: dimmed ? 0.45 : 1,
            cursor: dimmed ? "not-allowed" : "pointer",
            pointerEvents: dimmed ? "none" : "auto",
            textAlign: "left",
            font: "inherit",
            color: "inherit",
          };

          const nameStyle: CSSProperties = {
            fontWeight: 700,
            fontSize: "1rem",
            marginBottom: "0.35rem",
          };

          const metaStyle: CSSProperties = {
            fontSize: "0.8rem",
            color: "#bbb",
            marginBottom: "0.5rem",
            lineHeight: 1.35,
          };

          const epStyle: CSSProperties = {
            fontSize: "0.85rem",
            color: "#D73F09",
            fontWeight: 600,
            marginBottom: "0.5rem",
          };

          const fxStyle: CSSProperties = {
            fontSize: "0.8rem",
            color: "#ddd",
            lineHeight: 1.4,
          };

          return (
            <button
              key={activity.id}
              type="button"
              onClick={() => {
                if (dimmed) return;
                onSelect(activity.id);
              }}
              disabled={dimmed}
              style={cardStyle}
            >
              <div style={nameStyle}>{activity.name}</div>
              <div style={metaStyle}>{activity.location}</div>
              <div style={epStyle}>{activity.epCost} EP</div>
              <div style={fxStyle}>{formatEffectsSummary(activity.effects)}</div>
            </button>
          );
        })}
      </div>

      <footer style={footerStyle}>
        <button
          type="button"
          style={buttonStyle}
          disabled={mustSpendEp}
          onClick={() => {
            if (!mustSpendEp) onConfirm();
          }}
        >
          End Week
        </button>
      </footer>
    </div>
  );
}
