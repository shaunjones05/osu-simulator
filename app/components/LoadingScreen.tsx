"use client";

import { useEffect, useRef } from "react";
import styles from "./LoadingScreen.module.css";

const DISMISS_MS = 2500;

type LoadingScreenProps = {
  onDone: () => void;
};

export default function LoadingScreen({ onDone }: LoadingScreenProps) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const id = window.setTimeout(() => {
      onDoneRef.current();
    }, DISMISS_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className={styles.screen} role="status" aria-live="polite">
      <div className={styles.mascotRow}>
        <span className={styles.beaver} aria-hidden>
          🦫
        </span>
        <div className={styles.shadow} aria-hidden />
      </div>
      <div className={styles.titleBlock}>
        <h1 className={`${styles.titleLine1} osu-display-font osu-display-font--hero`}>
          BEAVER LIFE
        </h1>
        <p className={`${styles.titleLine2} osu-display-font osu-display-font--title`}>
          SIMULATOR
        </p>
      </div>
      <div className={`${styles.loadingRow} osu-display-font osu-display-font--micro`}>
        <span>Loading</span>
        <span className={styles.dots} aria-hidden>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </div>
    </div>
  );
}
