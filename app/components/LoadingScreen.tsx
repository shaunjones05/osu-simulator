"use client";

import { useEffect, useRef } from "react";
import styles from "./LoadingScreen.module.css";

const DISMISS_MS = 2500;

export type LoadingScreenProps =
  | {
      /** Initial splash — auto-dismiss after 2.5s. */
      mode?: "boot";
      onDone: () => void;
    }
  | {
      /** While the week is simming — stays until parent unmounts. */
      mode: "simming";
    };

export default function LoadingScreen(props: LoadingScreenProps) {
  const isSimming = props.mode === "simming";
  const mode = isSimming ? "simming" : "boot";
  const onDone = isSimming ? undefined : props.onDone;

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (mode !== "boot" || !onDoneRef.current) return;
    const id = window.setTimeout(() => {
      onDoneRef.current?.();
    }, DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [mode]);

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
      {mode === "simming" ? (
        <div
          className={`${styles.loadingRow} ${styles.loadingRowSimming} osu-display-font osu-display-font--micro osu-simming-pulse`}
        >
          <span>Simming to next week</span>
          <span className={styles.dots} aria-hidden>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      ) : (
        <div className={`${styles.loadingRow} osu-display-font osu-display-font--micro`}>
          <span>Loading</span>
          <span className={styles.dots} aria-hidden>
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      )}
    </div>
  );
}
