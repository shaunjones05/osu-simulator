# 🦫 OSU Simulator

> *Survive 4 years at Oregon State — if you can.*

A BitLife-inspired life simulation game built exclusively around the Oregon State University
experience. Every location, decision, and event is pulled straight from real Corvallis campus life.

**Built at BeaverHacks 2026** by two first-time hackathon participants who are not CS majors.

🎮 **[Play it here](https://osu-simulator-neon.vercel.app)**

---

## What It Is

OSU Simulator puts you in the shoes of an incoming OSU freshman. Each week you're given a
set number of **Energy Points** to allocate across real OSU activities. Your choices affect
five stats that determine your fate over 4 years.

**Stats:**
- 🎓 GPA — drop below 2.0 and you're on academic probation. Drop below 1.0 and you're expelled.
- 💪 Health — acts as a global multiplier on all other stat gains. Let it collapse and everything suffers.
- 😊 Happiness — low happiness tanks your GPA gains and drains your health faster
- 👥 Social — isolation passively drains happiness every week
- ✨ Attractiveness — yes, it's a stat

**Real OSU locations throughout:**
Valley Library · Dixon Rec Center · Reser Stadium · Arnold Dining Hall ·
Kelley Engineering Center · Downward Dog · Rivas Taco Shop · Greek Row and more

---

## Key Features

- **AI-generated cutscenes** — After every week, Claude generates a personalized story about
  your week based on your name, major, the exact OSU locations you visited, and how your stats
  have changed since Week 1
- **Energy allocation system** — Strategic weekly decisions with real trade-offs
- **Full economy** — Jobs, a shop, and a risk/reward underground market
- **Dating system** — Find your soulmate on campus
- **Random events** — OSU-specific surprises every week (25% chance)
- **Special calendar events** — START orientation, midterms, finals, Beaver Classic and more
- **Multiple endings** — Dean's List, Social Legend, Straight-A Hermit, Balanced Beaver and more
- **Pixel art scenes** — Unique artwork for every OSU location
- **Weekly summary** — A personal narrative of your entire college career

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Next.js + React + TypeScript | Frontend and game logic |
| Anthropic Claude API | AI-generated weekly cutscene narratives |
| Vercel | Deployment |
| Cursor | AI-assisted development environment |

---

## Running Locally

```bash
git clone https://github.com/shaunjones05/osu-simulator.git
cd osu-simulator
npm install
```

Create a `.env.local` file in the root:
```
ANTHROPIC_API_KEY=your-api-key-here
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Team

Built in 24 hours at BeaverHacks 2026 by Shaun Jones, and Zeyad Eisawy, competing in our first hackathon.

---

*Go Beavers! 🦫*
