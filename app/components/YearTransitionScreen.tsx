"use client";

import { useEffect, useRef, type CSSProperties } from "react";

const ORANGE = "#D73F09";
const BG = "#0d0d0d";

export type YearTransitionScreenProps = {
  title: string;
  flavorLine: string;
  onDismiss: () => void;
};

const DISMISS_MS = 2500;

export default function YearTransitionScreen({
  title,
  flavorLine,
  onDismiss,
}: YearTransitionScreenProps) {
  const dismissedRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    dismissedRef.current = false;
    const t = window.setTimeout(() => {
      if (dismissedRef.current) return;
      dismissedRef.current = true;
      onDismissRef.current();
    }, DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [title, flavorLine]);

  function handlePointerDown() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    onDismiss();
  }

  const shell: CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 20000,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 24px",
    boxSizing: "border-box",
    backgroundColor: BG,
    cursor: "pointer",
    textAlign: "center",
  };

  const titleStyle: CSSProperties = {
    color: ORANGE,
    margin: "0 0 20px",
    lineHeight: 1.35,
    maxWidth: "min(92vw, 36rem)",
  };

  const flavorStyle: CSSProperties = {
    margin: 0,
    color: "rgba(255, 255, 255, 0.82)",
    fontSize: "clamp(0.95rem, 2.8vw, 1.15rem)",
    lineHeight: 1.5,
    fontWeight: 500,
    maxWidth: "min(90vw, 28rem)",
    fontFamily:
      'var(--font-body), Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  const hintStyle: CSSProperties = {
    marginTop: "2.5rem",
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.38)",
    fontFamily:
      'var(--font-body), Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="year-transition-title"
      style={shell}
      onClick={handlePointerDown}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handlePointerDown();
        }
      }}
      tabIndex={0}
    >
      <h1
        id="year-transition-title"
        className="osu-display-font osu-display-font--hero"
        style={titleStyle}
      >
        {title}
      </h1>
      <p style={flavorStyle}>{flavorLine}</p>
      <p style={hintStyle}>Tap or wait to continue</p>
    </div>
  );
}
