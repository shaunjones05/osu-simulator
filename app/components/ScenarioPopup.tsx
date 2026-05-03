"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

export type ScenarioConsequence = {
  gpa?: number;
  health?: number;
  happiness?: number;
  social?: number;
  message?: string;
};

export type ScenarioChoice = {
  label: string;
  consequence: ScenarioConsequence;
};

export type ScenarioForPopup = {
  id: string;
  title: string;
  description: string;
  choices: ScenarioChoice[];
};

const STAT_KEYS = ["gpa", "health", "happiness", "social"] as const;

const STAT_LABELS: Record<(typeof STAT_KEYS)[number], string> = {
  gpa: "GPA",
  health: "Health",
  happiness: "Happiness",
  social: "Social",
};

export type ScenarioPopupProps = {
  scenario: ScenarioForPopup;
  onComplete: (choiceIndex: number) => void;
};

export default function ScenarioPopup({
  scenario,
  onComplete,
}: ScenarioPopupProps) {
  const [phase, setPhase] = useState<"choose" | "reveal">("choose");
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);

  const overlay: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    backgroundColor: "rgba(0, 0, 0, 0.82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
  };

  const modal: CSSProperties = {
    width: "100%",
    maxWidth: "520px",
    maxHeight: "min(90vh, 640px)",
    overflowY: "auto",
    backgroundColor: "#141210",
    border: "1px solid rgba(215, 63, 9, 0.45)",
    borderRadius: "14px",
    padding: "24px 22px 22px",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.55)",
    color: "#fafaf9",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  const titleStyle: CSSProperties = {
    margin: "0 0 12px",
    fontSize: "1.35rem",
    fontWeight: 800,
    lineHeight: 1.25,
    color: "#fff",
  };

  const descStyle: CSSProperties = {
    margin: "0 0 22px",
    fontSize: "1rem",
    lineHeight: 1.55,
    color: "rgba(255, 255, 255, 0.82)",
  };

  const choiceBtn: CSSProperties = {
    width: "100%",
    marginBottom: "10px",
    padding: "14px 16px",
    fontSize: "1rem",
    fontWeight: 600,
    textAlign: "left",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    color: "#fff",
    cursor: "pointer",
  };

  const messageBox: CSSProperties = {
    marginTop: "8px",
    marginBottom: "18px",
    padding: "16px 16px",
    borderRadius: "10px",
    backgroundColor: "rgba(215, 63, 9, 0.12)",
    border: "1px solid rgba(215, 63, 9, 0.35)",
    fontSize: "0.98rem",
    lineHeight: 1.55,
    color: "#fff7ed",
  };

  const statLine: CSSProperties = {
    fontSize: "0.95rem",
    fontWeight: 700,
    marginBottom: "6px",
    fontVariantNumeric: "tabular-nums",
  };

  const continueBtn: CSSProperties = {
    width: "100%",
    marginTop: "8px",
    padding: "14px 16px",
    fontSize: "1.05rem",
    fontWeight: 700,
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    backgroundColor: "#D73F09",
    color: "#fff",
  };

  function handlePick(index: number) {
    setChosenIndex(index);
    setPhase("reveal");
  }

  const consequence =
    chosenIndex !== null
      ? scenario.choices[chosenIndex]?.consequence
      : undefined;

  const statDeltas: { key: (typeof STAT_KEYS)[number]; delta: number }[] = [];
  if (consequence) {
    for (const key of STAT_KEYS) {
      const v = consequence[key];
      if (v !== undefined && v !== 0 && typeof v === "number") {
        statDeltas.push({ key, delta: v });
      }
    }
  }

  return (
    <div style={overlay} role="dialog" aria-modal="true" aria-labelledby="scenario-title">
      <div style={modal}>
        <h2 id="scenario-title" style={titleStyle}>
          {scenario.title}
        </h2>
        <p style={descStyle}>{scenario.description}</p>

        {phase === "choose" ? (
          <>
            {scenario.choices.slice(0, 2).map((c, i) => (
              <button
                key={i}
                type="button"
                style={choiceBtn}
                onClick={() => handlePick(i)}
              >
                {c.label}
              </button>
            ))}
          </>
        ) : (
          <>
            {consequence?.message ? (
              <div style={messageBox}>{consequence.message}</div>
            ) : null}
            {statDeltas.length > 0 ? (
              <div style={{ marginBottom: "16px" }}>
                {statDeltas.map(({ key, delta }) => (
                  <div
                    key={key}
                    style={{
                      ...statLine,
                      color: delta > 0 ? "#4ade80" : "#f87171",
                    }}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta} {STAT_LABELS[key]}
                  </div>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              style={continueBtn}
              onClick={() => {
                if (chosenIndex !== null) onComplete(chosenIndex);
              }}
            >
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
