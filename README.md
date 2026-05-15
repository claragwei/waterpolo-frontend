# aqualytics

**aqualytics** is the UC Davis men's water polo analytics platform: live stat tracking, match insights, player performance indexing, and coach-ready PDF reports. The app replaces pen-and-paper box scores with structured data in Supabase and a FastAPI backend.

## Project summary

Coaches and players use aqualytics to log games in real time, review match and season trends, and export reports. The product vision (from our capstone deck) is to move lineup evaluation from subjective “eye tests” toward **quantified player impact**—including RAPM-style ratings, performance vs. play time, and substitution guidance—while keeping the workflow fast enough for poolside use.

**What ships today**

| Area | Status |
|------|--------|
| Live Stats (dual-team logging) | Production path — writes to DB |
| Matches, Players, Player Insights | API-backed |
| Login (Supabase, player/coach role) | Production |
| Reports — quarter/halftime demo | Mock Stanford scenario + **working PDF** |
| Reports — team analytics panel | RAPM-style proxy, regression, sub hints + **PDF** |
| Full stint-based RAPM (6-man lineups) | Roadmap — needs lineup stint tracking |

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 18, TypeScript, Vite, React Router, Tailwind, Radix UI, Recharts |
| PDF export | `@react-pdf/renderer` |
| Auth | Supabase Auth (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) |
| API | FastAPI (Python), Peewee ORM, PostgreSQL (Supabase) |
| Deploy | Vercel (frontend), Render (backend) |

## Environment variables

**Frontend** (`.env` / Vercel):

- `VITE_API_URL` — e.g. `https://aqualytics-uegu.onrender.com` (no `/docs` suffix)
- `VITE_API_KEY` — matches backend `API_KEY`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_UCD_TEAM_ID` — optional, default `1`

**Backend** (`backend/.env`):

- `DATABASE_URL`, `API_KEY`, Supabase keys as needed

## Running locally

```bash
npm install
npm run dev
```

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Player performance index (PPI) — Riley

**PPI** is stored per player per match in `playermatchstats.score` (0–100). It is computed in `backend/main.py` → `compute_and_save_score()` whenever stats are saved.

Weighted normalized components:

| Stat | Weight |
|------|--------|
| Shot conversion (goals/shots) | 32% |
| Assists | 16% |
| Steals | 16% |
| Rebounds | 8% |
| Sprints | 8% |
| Hustle | 7% |
| Draws | 5% |

Each stat is capped against league maxima, scaled 0–100, then combined. **Tiers:** elite (≥80), strong (≥60), average (≥40), developing (&lt;40).

**API**

- `GET /api/players/{id}/stats/{match_id}/score`
- `GET /api/players/{id}/scores`
- `GET /api/matches/{match_id}/scores`

**Frontend:** Match Details still shows a simple **“Index”** (`goals×2 + assists + steals×0.5`) in the UI; Reports and Team Analytics use **PPI** via `src/reports/performanceScore.ts`.

## Phase-1 regression (Tarini) — offline research

Commit `c321239` added `backend/analysis/phase1_performance_analysis.py`. It:

1. Pulls completed-match stats from Supabase  
2. Recomputes PPI per row  
3. Fits **per-player linear regression**: `time_in_pool` → PPI  
4. Writes `backend/analysis/output/` (CSV, JSON baselines, plots)

This script is **not** served by the website; run manually:

```bash
cd backend/analysis
python phase1_performance_analysis.py
```

The Reports page **Team analytics** section reimplements the same ideas in the browser for coaches (Pearson *r*, substitution hints).

## RAPM & presentation features

**True RAPM** (Regularized Adjusted Plus-Minus) needs who was in the pool together for each stint. We do not log 6-man stints yet, so the app uses a **RAPM-style proxy**: PPI minus team average, shrunk by games played (`src/reports/playerAnalytics.ts` → `computeSimulatedRAPM`).

Implemented on **Reports → Team analytics**:

- Horizontal bar chart (green / red vs team)  
- Performance vs play time (Pearson *r* + coaching blurb)  
- Substitution recommendations (low PPI + high minutes on latest match)  
- **Download analytics PDF**

Full lineup RAPM from the deck is the next step once stint data exists in Live Stats.

## Reports & PDFs

| Report | Data source | PDF |
|--------|-------------|-----|
| Quarter / Halftime (demo) | Mock Stanford Q1/Q2 | Yes |
| Player development | `GET /api/players/{id}/averages` | Yes (includes PPI when stats exist) |
| Team analytics | Completed matches via API | Yes |

PDF helpers live in `src/reports/` (`MatchReportPdf.tsx`, `TeamAnalyticsReportPdf.tsx`, `PlayerSeasonReportPdf.tsx`, `reportDownloads.ts`).

## Repository layout

```
src/                 React app
src/reports/         PDF + analytics math
src/components/      UI including Reports, Live Stats
backend/             FastAPI + models
backend/analysis/    Offline regression (Tarini)
```

## Team contributions (high level)

- **Riley** — PPI, score APIs, DB schema  
- **Keira** — Supabase auth, roles  
- **Sebastian** — Reports UI, Player Stats page  
- **Tarini** — Phase-1 regression analysis, merge/integration  
- **Clara** — Live Stats, API hardening, heatmaps (branch-dependent)

## License / course

UC Davis ASA capstone — internal team use. Figma source: BreakThisOne design file (product renamed **aqualytics** in app title and package name).
