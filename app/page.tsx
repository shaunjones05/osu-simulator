"use client";

import { useState, type CSSProperties } from "react";
import { INITIAL_STATS, ENERGY_BY_YEAR } from "./lib/gameData.js";
import StartScreen from "./components/StartScreen";
import StatBars from "./components/StatBars";

export default function Home() {
  const [playerName, setPlayerName] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [currentYear, setCurrentYear] = useState(1);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [stats, setStats] = useState(() => ({ ...INITIAL_STATS }));
  const [energyRemaining, setEnergyRemaining] = useState(
    ENERGY_BY_YEAR.year1,
  );

  if (!gameStarted) {
    return (
      <StartScreen
        onStart={(name) => {
          setPlayerName(name);
          setCurrentYear(1);
          setCurrentWeek(1);
          setStats({ ...INITIAL_STATS });
          setEnergyRemaining(ENERGY_BY_YEAR.year1);
          setGameStarted(true);
        }}
      />
    );
  }

  const shell: CSSProperties = {
    minHeight: "100vh",
    backgroundColor: "#1A1A1A",
    color: "#FFFFFF",
    padding: 24,
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  };

  const header: CSSProperties = {
    marginBottom: 24,
    borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
    paddingBottom: 16,
  };

  const titleRow: CSSProperties = {
    fontSize: "1.25rem",
    fontWeight: 600,
    marginBottom: 6,
  };

  const metaRow: CSSProperties = {
    fontSize: "0.95rem",
    opacity: 0.9,
  };

  const placeholder: CSSProperties = {
    marginTop: 28,
    padding: 20,
    borderRadius: 8,
    border: "1px dashed rgba(255, 255, 255, 0.25)",
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  };

  return (
    <div style={shell}>
      <header style={header}>
        <div style={titleRow}>{playerName || "Player"}</div>
        <div style={metaRow}>
          Year {currentYear} · Week {currentWeek}
        </div>
      </header>
      <StatBars stats={stats} />
      <div style={placeholder} data-energy={energyRemaining}>
        Activity picker goes here
      </div>
    </div>
  );
}
