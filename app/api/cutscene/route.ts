import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  buildCutsceneUserPrompt,
  buildWeeklyScenarioJsonPrompt,
} from "@/app/lib/aiCutscene.js";
import { anthropicMessagesComplete } from "@/app/lib/anthropicServer.js";

const FALLBACK_STORY = "Another week at OSU in the books.";

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(trimmed);
  const raw = fence ? fence[1].trim() : trimmed;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(raw.slice(start, end + 1)) as unknown;
    }
    throw new Error("Invalid JSON in model response");
  }
}

function normalizeApiScenario(
  raw: unknown,
  year: number,
  week: number,
): {
  id: string;
  title: string;
  description: string;
  choices: { label: string; consequence: Record<string, unknown> }[];
} | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title : "";
  const description = typeof o.description === "string" ? o.description : "";
  const choices = o.choices;
  if (!Array.isArray(choices) || choices.length < 2) return null;
  const c0 = choices[0];
  const c1 = choices[1];
  if (!c0 || !c1 || typeof c0 !== "object" || typeof c1 !== "object")
    return null;
  const a0 = c0 as Record<string, unknown>;
  const a1 = c1 as Record<string, unknown>;
  const l0 = typeof a0.label === "string" ? a0.label : "Choice A";
  const l1 = typeof a1.label === "string" ? a1.label : "Choice B";
  const q0 =
    a0.consequence && typeof a0.consequence === "object"
      ? (a0.consequence as Record<string, unknown>)
      : {};
  const q1 =
    a1.consequence && typeof a1.consequence === "object"
      ? (a1.consequence as Record<string, unknown>)
      : {};
  return {
    id: `api_scenario_${year}_${week}`,
    title,
    description,
    choices: [
      { label: l0, consequence: q0 },
      { label: l1, consequence: q1 },
    ],
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const playerName = String(body.playerName ?? "");
    const year = Number(body.year) || 1;
    const week = Number(body.week) || 1;
    const chosenActivities = Array.isArray(body.chosenActivities)
      ? body.chosenActivities
      : [];
    const finalStats = (body.finalStats as Record<string, number>) ?? {};
    const baseline = (body.baseline as Record<string, number>) ?? {};

    const cutscenePrompt = buildCutsceneUserPrompt(
      playerName,
      year,
      week,
      chosenActivities,
      finalStats,
      baseline,
    );
    const scenarioPrompt = buildWeeklyScenarioJsonPrompt(
      playerName,
      year,
      week,
      chosenActivities,
      randomUUID(),
    );

    const [storyText, apiScenario] = await Promise.all([
      anthropicMessagesComplete(cutscenePrompt, 300).catch(() => FALLBACK_STORY),
      anthropicMessagesComplete(scenarioPrompt, 900)
        .then((rawJson) => {
          const parsed = extractJsonObject(rawJson);
          return normalizeApiScenario(parsed, year, week);
        })
        .catch(() => null),
    ]);

    return NextResponse.json({ storyText, apiScenario });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Bad request" },
      { status: 400 },
    );
  }
}
