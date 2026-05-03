"use client";

import {
  Fragment,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

export type StartScreenProps = {
  onStart: (playerName: string, playerMajor: string) => void;
};

const ORANGE = "#D73F09";

export default function StartScreen({ onStart }: StartScreenProps) {
  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [majorFocused, setMajorFocused] = useState(false);
  const [startHover, setStartHover] = useState(false);

  const bodyFont =
    'var(--font-body), Inter, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  const bgImg: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 0,
    pointerEvents: "none",
  };

  const overlay: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0, 0, 0, 0.55)",
    zIndex: 1,
    pointerEvents: "none",
  };

  const shell: CSSProperties = {
    position: "relative",
    zIndex: 2,
    minHeight: "100vh",
    width: "100%",
    margin: 0,
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    fontFamily: bodyFont,
  };

  const card: CSSProperties = {
    position: "relative",
    zIndex: 2,
    background: "rgba(26, 26, 26, 0.88)",
    borderRadius: 16,
    padding: "40px 48px",
    maxWidth: 480,
    width: "90%",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
    textAlign: "center",
    boxSizing: "border-box",
  };

  const title: CSSProperties = {
    margin: "12px 0 0",
    color: ORANGE,
    lineHeight: 1.35,
  };

  const subtitle: CSSProperties = {
    margin: "14px 0 0",
    fontSize: "clamp(0.95rem, 2.2vw, 1.1rem)",
    fontWeight: 500,
    color: "#FFFFFF",
    lineHeight: 1.5,
    opacity: 0.95,
  };

  const divider: CSSProperties = {
    height: 1,
    background: ORANGE,
    margin: "20px 0",
    border: "none",
  };

  const label: CSSProperties = {
    display: "block",
    textAlign: "left",
    fontSize: "0.8rem",
    color: "rgba(255, 255, 255, 0.55)",
    marginBottom: 6,
    fontWeight: 600,
  };

  const inputBase: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 16px",
    fontSize: "1rem",
    borderRadius: 8,
    backgroundColor: "#2a2a2a",
    color: "#FFFFFF",
    outline: "none",
    marginBottom: 0,
    fontFamily: bodyFont,
  };

  const nameInputWrap: CSSProperties = { marginBottom: 16 };
  const majorInputWrap: CSSProperties = { marginBottom: 0 };

  const button: CSSProperties = {
    width: "100%",
    padding: 14,
    marginTop: 24,
    fontSize: "clamp(0.55rem, 2vw, 0.72rem)",
    fontWeight: 700,
    color: "#FFFFFF",
    backgroundColor: ORANGE,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    filter: startHover ? "brightness(1.1)" : "brightness(1)",
    transition: "filter 0.15s ease",
  };

  const footer: CSSProperties = {
    marginTop: 20,
    fontSize: "0.75rem",
    color: "rgba(255, 255, 255, 0.45)",
    lineHeight: 1.5,
  };

  function handleStart() {
    onStart(name.trim(), major.trim());
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleStart();
    }
  }

  return (
    <Fragment>
      {/* eslint-disable-next-line @next/next/no-img-element -- full-viewport decorative background */}
      <img
        src="/scenes/graduation.png"
        alt=""
        style={bgImg}
        aria-hidden
      />
      <div style={overlay} aria-hidden />
      <div style={shell}>
        <div style={card}>
          <div
            style={{ fontSize: "1.75rem", lineHeight: 1, marginBottom: 4 }}
            aria-hidden
          >
            🦫
          </div>
          <h1 className="osu-display-font osu-display-font--hero" style={title}>
            OSU SIMULATOR
          </h1>
          <p style={subtitle}>Survive 4 years at Oregon State</p>
          <hr style={divider} />
          <div style={nameInputWrap}>
            <label htmlFor="player-name" style={label}>
              Your Name
            </label>
            <input
              id="player-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholder="Enter your name, Beaver..."
              aria-label="Player name"
              style={{
                ...inputBase,
                border: `2px solid ${nameFocused ? ORANGE : "#404040"}`,
              }}
              autoComplete="name"
            />
          </div>
          <div style={majorInputWrap}>
            <label htmlFor="player-major" style={label}>
              Your Major
            </label>
            <input
              id="player-major"
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setMajorFocused(true)}
              onBlur={() => setMajorFocused(false)}
              placeholder="e.g. Business, Computer Science, Kinesiology..."
              aria-label="Player major"
              style={{
                ...inputBase,
                border: `2px solid ${majorFocused ? ORANGE : "#404040"}`,
              }}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className="osu-display-font"
            style={button}
            onClick={handleStart}
            onMouseEnter={() => setStartHover(true)}
            onMouseLeave={() => setStartHover(false)}
          >
            Start Game
          </button>
          <p style={footer}>Made at BeaverHacks 2026 🦫</p>
        </div>
      </div>
    </Fragment>
  );
}
