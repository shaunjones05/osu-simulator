/**
 * Lightweight 8-bit-style SFX via Web Audio API (no external assets).
 * All tones are kept under ~0.5s. Requires a user gesture to unlock AudioContext on some browsers.
 */

const STORAGE_KEY = "osu-sim-sound-muted";

let muted = false;
try {
  if (typeof window !== "undefined") {
    muted = window.localStorage.getItem(STORAGE_KEY) === "1";
  }
} catch {
  muted = false;
}

/** @type {AudioContext | null} */
let audioCtx = null;

export function getSoundMuted() {
  return muted;
}

export function setSoundMuted(value) {
  muted = Boolean(value);
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
    }
  } catch {
    /* ignore */
  }
}

function getContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  return audioCtx;
}

function resumeContext() {
  const ctx = getContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}

/**
 * @param {object} opts
 * @param {number} opts.freq
 * @param {number} opts.duration
 * @param {"sine"|"square"|"sawtooth"|"triangle"} [opts.type]
 * @param {number} [opts.gain]
 * @param {number} [opts.freqEnd] linear ramp to this frequency at end
 */
function tone({ freq, duration, type = "square", gain = 0.07, freqEnd }) {
  if (muted) return;
  const ctx = resumeContext();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const d = Math.min(0.45, Math.max(0.02, duration));
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd != null && Number.isFinite(freqEnd)) {
    osc.frequency.linearRampToValueAtTime(freqEnd, t0 + d);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + d + 0.02);
}

/** Short rising “power up” bleeps. */
export function playStatUp() {
  if (muted) return;
  const ctx = resumeContext();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const notes = [330, 440, 550];
  notes.forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(f, t0 + i * 0.055);
    g.gain.setValueAtTime(0.0001, t0 + i * 0.055);
    g.gain.exponentialRampToValueAtTime(0.06, t0 + i * 0.055 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.055 + 0.07);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0 + i * 0.055);
    o.stop(t0 + i * 0.055 + 0.08);
  });
}

/** Short falling tone. */
export function playStatDown() {
  tone({
    freq: 420,
    freqEnd: 180,
    duration: 0.22,
    type: "square",
    gain: 0.065,
  });
}

/** Confirm week — quick “coin” + bright ping. */
export function playConfirm() {
  if (muted) return;
  const ctx = resumeContext();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const click = ctx.createOscillator();
  const cg = ctx.createGain();
  click.type = "square";
  click.frequency.setValueAtTime(880, t0);
  click.frequency.exponentialRampToValueAtTime(120, t0 + 0.04);
  cg.gain.setValueAtTime(0.0001, t0);
  cg.gain.exponentialRampToValueAtTime(0.09, t0 + 0.003);
  cg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
  click.connect(cg);
  cg.connect(ctx.destination);
  click.start(t0);
  click.stop(t0 + 0.06);

  const ping = ctx.createOscillator();
  const pg = ctx.createGain();
  ping.type = "triangle";
  ping.frequency.setValueAtTime(1200, t0 + 0.04);
  ping.frequency.exponentialRampToValueAtTime(600, t0 + 0.14);
  pg.gain.setValueAtTime(0.0001, t0 + 0.04);
  pg.gain.exponentialRampToValueAtTime(0.05, t0 + 0.055);
  pg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
  ping.connect(pg);
  pg.connect(ctx.destination);
  ping.start(t0 + 0.04);
  ping.stop(t0 + 0.2);
}

/** Game over — short sad descent. */
export function playGameOver() {
  if (muted) return;
  const ctx = resumeContext();
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const steps = [
    { f: 380, t: 0, d: 0.12 },
    { f: 300, t: 0.11, d: 0.12 },
    { f: 220, t: 0.22, d: 0.14 },
    { f: 150, t: 0.35, d: 0.12 },
  ];
  for (const s of steps) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(s.f, t0 + s.t);
    o.frequency.exponentialRampToValueAtTime(s.f * 0.75, t0 + s.t + s.d);
    g.gain.setValueAtTime(0.0001, t0 + s.t);
    g.gain.exponentialRampToValueAtTime(0.06, t0 + s.t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + s.t + s.d);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0 + s.t);
    o.stop(t0 + s.t + s.d + 0.02);
  }
}

const STAT_KEYS = ["gpa", "health", "happiness", "social", "attractiveness"];

/**
 * Play stat up/down once each if any core stat moved (week summary or scenario).
 * @param {Record<string, number> | null | undefined} before
 * @param {Record<string, number> | null | undefined} after
 */
export function playStatDeltaFromStats(before, after) {
  if (muted || !before || !after) return;
  let anyUp = false;
  let anyDown = false;
  for (const k of STAT_KEYS) {
    const a = Math.round(Number(before[k]) || 0);
    const b = Math.round(Number(after[k]) || 0);
    if (b > a) anyUp = true;
    if (b < a) anyDown = true;
  }
  if (anyUp) playStatUp();
  if (anyDown) {
    const delay = anyUp ? 140 : 0;
    if (typeof window !== "undefined") {
      window.setTimeout(() => playStatDown(), delay);
    }
  }
}
