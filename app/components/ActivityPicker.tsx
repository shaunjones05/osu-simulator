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

const ORANGE = "#D73F09";
const BG = "#1A1A1A";

const EFFECT_LABELS: Record<keyof Activity["effects"], string> = {
  gpa: "GPA",
  health: "Health",
  happiness: "Happiness",
  social: "Social",
};

function formatEffectsSummary(effects: Activity["effects"]): string {
  const keys = Object.keys(EFFECT_LABELS) as (keyof Activity["effects"])[];
  const parts: string[] = [];
  for (const key of keys) {
    const v = effects[key];
    if (v === 0) continue;
    const sign = v > 0 ? "+" : "";
    parts.push(`${sign}${v} ${EFFECT_LABELS[key]}`);
  }
  return parts.length > 0 ? parts.join(", ") : "No stat change";
}

function countSelections(weekSelections: string[], id: string): number {
  let n = 0;
  for (const s of weekSelections) {
    if (s === id) n += 1;
  }
  return n;
}

export type ActivityPickerProps = {
  activities: Activity[];
  energyRemaining: number;
  totalEnergy: number;
  weekSelections: string[];
  onAdd: (activityId: string) => void;
  onRemove: (activityId: string) => void;
  onConfirm: () => void;
};

export default function ActivityPicker({
  activities,
  energyRemaining,
  totalEnergy,
  weekSelections,
  onAdd,
  onRemove,
  onConfirm,
}: ActivityPickerProps) {
  const spentEp = weekSelections.reduce((sum, id) => {
    const a = activities.find((act) => act.id === id);
    return sum + (a?.epCost ?? 0);
  }, 0);
  const canConfirm = spentEp >= 1;
  const lowEnergy = energyRemaining < 3;

  const rootStyle: CSSProperties = {
    backgroundColor: BG,
    color: "#FFFFFF",
    padding: "1.25rem",
    borderRadius: "10px",
    maxWidth: "800px",
    margin: "0 auto",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  const headerStyle: CSSProperties = {
    marginBottom: "1.25rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
    textAlign: "center",
  };

  const epLabelStyle: CSSProperties = {
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255, 255, 255, 0.65)",
    marginBottom: "0.4rem",
  };

  const epValueStyle: CSSProperties = {
    fontSize: "2.75rem",
    fontWeight: 800,
    lineHeight: 1.05,
    color: lowEnergy ? "#D73F09" : "#FFFFFF",
    textShadow: lowEnergy ? "0 0 24px rgba(215, 63, 9, 0.35)" : undefined,
    transition: "color 0.2s ease",
  };

  const epSubStyle: CSSProperties = {
    marginTop: "0.35rem",
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.55)",
  };

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "0.85rem",
    marginBottom: "1.25rem",
  };

  const footerStyle: CSSProperties = {
    marginTop: "0.25rem",
  };

  const confirmStyle: CSSProperties = {
    width: "100%",
    padding: "0.95rem 1rem",
    fontSize: "1.05rem",
    fontWeight: 700,
    border: "none",
    borderRadius: "8px",
    cursor: canConfirm ? "pointer" : "not-allowed",
    backgroundColor: canConfirm ? ORANGE : "#3A3A3A",
    color: "#FFFFFF",
    opacity: canConfirm ? 1 : 0.55,
    transition: "background-color 0.2s ease, opacity 0.2s ease",
  };

  return (
    <div style={rootStyle}>
      <header style={headerStyle}>
        <div style={epLabelStyle}>Energy remaining</div>
        <div style={epValueStyle}>{energyRemaining} EP</div>
        <div style={epSubStyle}>
          {spentEp} spent this week · {totalEnergy} total
        </div>
      </header>

      <div style={gridStyle}>
        {activities.map((activity) => {
          const count = countSelections(weekSelections, activity.id);
          const selected = count > 0;
          const cannotAdd = activity.epCost > energyRemaining;

          const cardStyle: CSSProperties = {
            display: "flex",
            flexDirection: "column",
            padding: "1rem",
            borderRadius: "10px",
            border: selected ? `2px solid ${ORANGE}` : "2px solid #333333",
            backgroundColor: selected
              ? "rgba(215, 63, 9, 0.14)"
              : "rgba(255, 255, 255, 0.04)",
            textAlign: "left",
            minHeight: "100%",
            boxSizing: "border-box",
            transition:
              "border-color 0.2s ease, background-color 0.2s ease",
          };

          const titleRow: CSSProperties = {
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.5rem",
            marginBottom: "0.4rem",
          };

          const nameStyle: CSSProperties = {
            fontWeight: 700,
            fontSize: "1rem",
            lineHeight: 1.25,
            color: "#FFFFFF",
            flex: 1,
          };

          const badgeStyle: CSSProperties = {
            flexShrink: 0,
            fontSize: "0.75rem",
            fontWeight: 700,
            padding: "0.2rem 0.45rem",
            borderRadius: "6px",
            backgroundColor: ORANGE,
            color: "#FFFFFF",
          };

          const metaStyle: CSSProperties = {
            fontSize: "0.8rem",
            color: "rgba(255, 255, 255, 0.72)",
            marginBottom: "0.5rem",
            lineHeight: 1.35,
          };

          const epLineStyle: CSSProperties = {
            fontSize: "0.85rem",
            color: ORANGE,
            fontWeight: 700,
            marginBottom: "0.45rem",
          };

          const fxStyle: CSSProperties = {
            fontSize: "0.8rem",
            color: "rgba(255, 255, 255, 0.88)",
            lineHeight: 1.45,
            marginBottom: "0.75rem",
            flex: 1,
          };

          const actionsRow: CSSProperties = {
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "auto",
          };

          const iconBtn = (variant: "minus" | "plus", disabled: boolean): CSSProperties => ({
            width: "2.5rem",
            height: "2.5rem",
            padding: 0,
            fontSize: "1.35rem",
            fontWeight: 700,
            lineHeight: 1,
            borderRadius: "8px",
            border: disabled
              ? "1px solid #444444"
              : variant === "plus"
                ? `2px solid ${ORANGE}`
                : "1px solid rgba(255, 255, 255, 0.35)",
            backgroundColor:
              disabled
                ? "#2A2A2A"
                : variant === "plus"
                  ? ORANGE
                  : "rgba(255, 255, 255, 0.08)",
            color: disabled ? "#666666" : "#FFFFFF",
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.45 : 1,
            flexShrink: 0,
            transition: "opacity 0.15s ease, background-color 0.15s ease",
          });

          return (
            <div key={activity.id} style={cardStyle}>
              <div style={titleRow}>
                <div style={nameStyle}>{activity.name}</div>
                {selected ? (
                  <span style={badgeStyle} aria-label={`${count} selected`}>
                    x{count}
                  </span>
                ) : null}
              </div>
              <div style={metaStyle}>{activity.location}</div>
              <div style={epLineStyle}>{activity.epCost} EP each</div>
              <div style={fxStyle}>
                {formatEffectsSummary(activity.effects)}
              </div>
              <div style={actionsRow}>
                {count > 0 ? (
                  <button
                    type="button"
                    aria-label={`Remove one ${activity.name}`}
                    style={iconBtn("minus", false)}
                    onClick={() => onRemove(activity.id)}
                  >
                    −
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label={`Add one ${activity.name}`}
                  style={iconBtn("plus", cannotAdd)}
                  disabled={cannotAdd}
                  onClick={() => {
                    if (!cannotAdd) onAdd(activity.id);
                  }}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <footer style={footerStyle}>
        <button
          type="button"
          style={confirmStyle}
          disabled={!canConfirm}
          onClick={() => {
            if (canConfirm) onConfirm();
          }}
        >
          End Week
        </button>
      </footer>
    </div>
  );
}
