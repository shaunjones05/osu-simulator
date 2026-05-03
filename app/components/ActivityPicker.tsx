"use client";

import type { CSSProperties } from "react";

export type Activity = {
  id: string;
  name: string;
  location: string;
  epCost: number;
  sceneImage: string;
  effects: {
    gpa: number;
    health: number;
    happiness: number;
    social: number;
  };
};

const ORANGE = "#D73F09";
const RED = "#EF4444";
const BG = "#1A1A1A";

const TIKI_TUESDAY_ID = "downward-dog-tiki-tuesday";

function countSelections(weekSelections: string[], id: string): number {
  let n = 0;
  for (const s of weekSelections) {
    if (s === id) n += 1;
  }
  return n;
}

function epDisplayColor(energyRemaining: number): string {
  if (energyRemaining <= 2) return RED;
  if (energyRemaining <= 4) return ORANGE;
  return "#FFFFFF";
}

export type ActivityPickerProps = {
  activities: Activity[];
  energyRemaining: number;
  /** Max EP per week (fixed at 5 in OSU Simulator v2). */
  totalEnergy: number;
  currentYear: number;
  weekSelections: string[];
  onAdd: (activityId: string) => void;
  onRemove: (activityId: string) => void;
  onConfirm: () => void;
  /** `page`: full card with EP header. `panel`: slide-out column — no EP header, scrollable list + pinned End Week. */
  variant?: "page" | "panel";
};

export default function ActivityPicker({
  activities,
  energyRemaining,
  totalEnergy,
  currentYear,
  weekSelections,
  onAdd,
  onRemove,
  onConfirm,
  variant = "page",
}: ActivityPickerProps) {
  const isPanel = variant === "panel";
  const spentEp = weekSelections.reduce((sum, id) => {
    const a = activities.find((act) => act.id === id);
    return sum + (a?.epCost ?? 0);
  }, 0);
  const canConfirm = spentEp >= 1;
  const epColor = epDisplayColor(energyRemaining);

  const rootPage: CSSProperties = {
    backgroundColor: BG,
    color: "#FFFFFF",
    padding: "1.25rem",
    borderRadius: "10px",
    maxWidth: "800px",
    margin: "0 auto",
    fontFamily:
      'var(--font-body), Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  const rootPanel: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    color: "#FFFFFF",
    fontFamily:
      'var(--font-body), Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    fontSize: "clamp(2.25rem, 8vw, 3.25rem)",
    fontWeight: 800,
    lineHeight: 1.05,
    color: epColor,
    textShadow:
      energyRemaining <= 4
        ? energyRemaining <= 2
          ? "0 0 28px rgba(239, 68, 68, 0.45)"
          : "0 0 28px rgba(215, 63, 9, 0.4)"
        : undefined,
    transition: "color 0.35s ease, text-shadow 0.35s ease",
    fontVariantNumeric: "tabular-nums",
  };

  const epSubStyle: CSSProperties = {
    marginTop: "0.35rem",
    fontSize: "0.85rem",
    color: "rgba(255, 255, 255, 0.55)",
  };

  const gridStylePage: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "0.85rem",
    marginBottom: "1.25rem",
  };

  const gridStylePanel: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "0.65rem",
    paddingBottom: "0.75rem",
  };

  const scrollAreaPanel: CSSProperties = {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "0 6px 4px",
    WebkitOverflowScrolling: "touch",
  };

  const footerStylePage: CSSProperties = {
    marginTop: "0.25rem",
  };

  const footerStylePanel: CSSProperties = {
    flexShrink: 0,
    padding: "12px 8px 16px",
    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
    marginTop: "auto",
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

  const cards = activities.map((activity) => {
    const count = countSelections(weekSelections, activity.id);
    const selected = count > 0;
    const cannotAdd = activity.epCost > energyRemaining;
    const isTikiLocked =
      activity.id === TIKI_TUESDAY_ID &&
      (currentYear === 1 || currentYear === 2);
    const locked = isTikiLocked;

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
      fontSize: "0.7rem",
      fontWeight: 700,
      padding: "0.15rem 0.4rem",
      borderRadius: "5px",
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
      marginBottom: "0.65rem",
    };

    const cardClass = [
      "osu-activity-card",
      selected ? "osu-activity-card--selected" : "",
      locked ? "osu-activity-card--locked" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const cardOuterStyle: CSSProperties = locked ? { opacity: 0.55 } : {};

    return (
      <div
        key={activity.id}
        className={cardClass}
        style={cardOuterStyle}
        title={
          locked ? "Must be 21+ (Junior or Senior)" : undefined
        }
      >
        <div style={titleRow}>
          <div style={nameStyle}>
            {locked ? (
              <span aria-hidden style={{ marginRight: 8 }}>
                🔒
              </span>
            ) : null}
            {activity.name}
          </div>
          {selected && !locked ? (
            <span style={badgeStyle} aria-label={`${count} selected`}>
              x{count}
            </span>
          ) : null}
        </div>
        <div style={metaStyle}>{activity.location}</div>
        <div style={epLineStyle}>{activity.epCost} EP each</div>
        <div className="osu-activity-actions">
          {count > 0 && !locked ? (
            <button
              type="button"
              className="osu-activity-btn osu-activity-btn--minus"
              aria-label={`Remove one ${activity.name}`}
              onClick={() => onRemove(activity.id)}
            >
              −
            </button>
          ) : null}
          <button
            type="button"
            className="osu-activity-btn osu-activity-btn--plus"
            aria-label={`Add one ${activity.name}`}
            disabled={cannotAdd || locked}
            onClick={() => {
              if (!cannotAdd && !locked) onAdd(activity.id);
            }}
          >
            +
          </button>
        </div>
      </div>
    );
  });

  const footer = (
    <footer style={isPanel ? footerStylePanel : footerStylePage}>
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
  );

  if (isPanel) {
    return (
      <div style={rootPanel}>
        <div style={scrollAreaPanel}>
          <div style={gridStylePanel}>{cards}</div>
        </div>
        {footer}
      </div>
    );
  }

  return (
    <div style={rootPage}>
      <header style={headerStyle}>
        <div style={epLabelStyle}>Energy remaining</div>
        <div style={epValueStyle}>{energyRemaining} EP</div>
        <div style={epSubStyle}>
          {spentEp} spent this week · {totalEnergy} max per week
        </div>
      </header>

      <div style={gridStylePage}>{cards}</div>

      {footer}
    </div>
  );
}
