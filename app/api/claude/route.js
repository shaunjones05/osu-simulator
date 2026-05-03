import { NextResponse } from "next/server";

export async function POST(req) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "your-key-here") {
    return NextResponse.json(
      {
        error: {
          type: "configuration_error",
          message:
            "ANTHROPIC_API_KEY is not set. Add it to `.env.local` in the project root and restart `npm run dev`.",
        },
      },
      { status: 503 },
    );
  }

  const body = await req.json();
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": key,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
