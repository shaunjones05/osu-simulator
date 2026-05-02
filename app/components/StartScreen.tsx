"use client";

import {
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

export type StartScreenProps = {
  onStart: (playerName: string) => void;
};

const ORANGE = "#D73F09";
const BG = "#1A1A1A";

export default function StartScreen({ onStart }: StartScreenProps) {
  const [name, setName] = useState("");

  const outer: CSSProperties = {
    minHeight: "100vh",
    margin: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BG,
    boxSizing: "border-box",
    padding: "24px",
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  const card: CSSProperties = {
    width: "100%",
    maxWidth: "420px",
    textAlign: "center",
  };

  const title: CSSProperties = {
    margin: "0 0 12px",
    fontSize: "2.25rem",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: ORANGE,
    lineHeight: 1.15,
  };

  const subtitle: CSSProperties = {
    margin: "0 0 32px",
    fontSize: "1.05rem",
    fontWeight: 400,
    color: "#FFFFFF",
    lineHeight: 1.5,
    opacity: 0.92,
  };

  const input: CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    color: "#FFFFFF",
    outline: "none",
    marginBottom: "24px",
  };

  const button: CSSProperties = {
    width: "100%",
    padding: "16px 24px",
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "#FFFFFF",
    backgroundColor: ORANGE,
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(215, 63, 9, 0.35)",
  };

  function handleStart() {
    onStart(name.trim());
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      handleStart();
    }
  }

  return (
    <div style={outer}>
      <div style={card}>
        <h1 style={title}>OSU Simulator</h1>
        <p style={subtitle}>Survive 4 years at Oregon State</p>
        <input
          id="player-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your name, Beaver..."
          aria-label="Player name"
          style={input}
          autoComplete="name"
        />
        <button type="button" style={button} onClick={handleStart}>
          Start Game
        </button>
      </div>
    </div>
  );
}
