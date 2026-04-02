# UC Davis Water Polo Analytics — Project Overview

## Purpose

A real-time stat tracking and analytics tool for the UC Davis water polo coaching staff. Coaches use the app during live games to log player actions (shots, goals, assists, blocks, etc.) against a running game clock, as well as game-level events (power plays, timeouts, referee calls, possessions). All data is persisted and surfaced as historical analytics.

---

## High-Level Architecture

```
┌────────────────────────────┐
│     React Frontend         │  ← Vite + TypeScript, shadcn/ui, Tailwind
│  (Live Tracking + Review)  │
└────────────┬───────────────┘
             │ HTTP REST (JSON) via api service (src/services/api.ts)
             ▼
┌────────────────────────────┐
│    FastAPI Python API      │  ← main.py, schemas.py, models.py
│    (Business Logic Layer)  │
└────────────┬───────────────┘
             │ Peewee ORM (PostgreSQL driver)
             ▼
┌────────────────────────────┐
│   Supabase (PostgreSQL)    │  ← Hosted DB, connection via DATABASE_URL
└────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), TypeScript |
| UI Components | shadcn/ui (`Card`, `Button`, `Badge`) |
| Icons | lucide-react |
| Notifications | sonner (toast) |
| API | FastAPI (Python 3.11+) |
| ORM | Peewee |
| Database | PostgreSQL via Supabase |
| Environment config | python-dotenv (`.env`) |
| Dev server | Uvicorn |

---

## Domain Model Summary

### Core Entities

- **Team** — UC Davis or an opponent team. UC Davis team is flagged via `is_uc_davis`.
- **Player** — Belongs to a team. Carries aggregated career stats (`total_goals`, etc.) updated after each match.
- **Match** — A single game between UC Davis and an opponent. Has a `status` (`scheduled`, `in_progress`, `completed`), score, game clock, quarter, and optional referee name.

### Per-Match Tracking

- **PlayerMatchStats** — One row per player per match. Tracks: `shots`, `goals`, `assists`, `steals`, `blocks`, `turnovers`, `exclusions`, `penalties`, `rebounds`, `tipped_passes`, `sprints`, `hustle`, `draws`, `time_in_pool`.
- **PlayByPlay** — Timestamped event log. Event types include: `goal`, `shot`, `assist`, `steal`, `turnover`, `exclusion`, `referee_call`, `substitution`, `team_stat`.
- **RefereeCall** — Logs referee decisions: `yellow-card`, `red-card`, `ejection`, `offensive-foul`, `defensive-foul`, `brutality`, `timeout`.
- **Possession** — Tracks possession sequences per team with start/end time and outcome.
- **PlayerNote** — Free-text coaching notes attached to a player, timestamped with quarter and game clock.

### Team-Level Stats (tracked as PlayByPlay events)

The frontend tracks these as `TeamStat` and syncs them via `POST /api/matches/{id}/plays`:
`FCO`, `FCD`, `CAO`, `CAD`, `AG`, `AGD`, `sixOnFive` (6v5), `fiveOnSix` (5v6), `sevenOnSix` (7v6), `sixOnSeven` (6v7)

### Heatmap Data

Shot/goal/assist locations are recorded as `(x, y)` percentages on a pool diagram, tagged with formation (`4-2` or `3-3`) and event type. These are stored as `PlayByPlay` events with `x_coordinate`, `y_coordinate`, and `formation` fields.

---

## Key Workflows

### Live Game Tracking

1. Coach edits player rosters ("Edit Players" modal) before starting.
2. Coach clicks "Start Game" → `POST /api/matches` → receives `match_id`.
3. As actions occur:
   - Stat buttons → `POST /api/matches/{id}/stats` (upsert per player)
   - Shot/Goal/Assist → heatmap modal → pin drop → `POST /api/matches/{id}/plays` with coordinates
   - Referee calls → modal → `POST /api/matches/{id}/plays` with `event_type: referee_call`
   - Substitutions → modal → `POST /api/matches/{id}/plays` with `event_type: substitution`
   - Team situations → `POST /api/matches/{id}/plays` with `event_type: team_stat`
4. Match clock and quarter updated client-side; synced via `PATCH /api/matches/{id}` on meaningful events.
5. Possession tracked client-side (running timer per team); recorded to `POST /api/matches/{id}/possessions`.

### Offline / Degraded Mode

The frontend is designed to operate in **local mode** if the API is unavailable. `handleStartGame` catches API errors and falls back to local-only state. All stats remain in React state and can be saved manually. The API calls in `updatePlayerStat`, `updateTeamStat`, `handleTurnover`, `handleSteal`, and `handlePinDrop` all use `try/catch` and log errors without blocking the UI.

### Game Clock

- The frontend owns the running clock (`gameTime` state, incremented by `setInterval` every second).
- Quarters are 8 minutes (480 seconds). Break durations: Q1→Q2: 2 min, halftime: 5 min, Q3→Q4: 2 min.
- Active ejections have a 20-second countdown; cleared on goal or possession change.
- The server does **not** run a clock.

---

## Environment Variables

```env
# Backend
DATABASE_URL=postgresql://user:password@host:port/dbname
CORS_ORIGINS=http://localhost:5173,https://your-production-domain.com
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False
API_KEY=your-secret-key

# Frontend
VITE_API_URL=http://localhost:8000
```

---

## Repository Structure (Target)

```
/
├── backend/
│   ├── main.py           # FastAPI app, all route definitions
│   ├── models.py         # Peewee ORM model definitions
│   ├── schemas.py        # Pydantic request/response schemas
│   ├── database.py       # DB connection and initialization
│   ├── auth.py           # API key dependency
│   ├── .env
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   │   └── api.ts          # API client (currently used by LiveStatsPageDual.tsx)
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui primitives (card, button, badge)
│   │   │   ├── GameHeader.tsx
│   │   │   ├── PossessionTimer.tsx
│   │   │   ├── PlayerGrid.tsx
│   │   │   ├── StatActionPanel.tsx
│   │   │   ├── TeamSituations.tsx
│   │   │   ├── RefereePanel.tsx
│   │   │   ├── PossessionTimeline.tsx
│   │   │   ├── HeatmapModal.tsx
│   │   │   ├── RefereeCallModal.tsx
│   │   │   ├── SubstitutionModal.tsx
│   │   │   └── PlayerEditModal.tsx
│   │   ├── pages/
│   │   │   └── LiveStatsPageDual.tsx   # Current monolithic page — to be refactored
│   │   ├── hooks/
│   │   │   ├── useGameClock.ts
│   │   │   └── useStatLogger.ts
│   │   └── types/
│   │       └── index.ts
│   └── vite.config.ts
└── docs/
    ├── overview.md
    ├── server_architecture.md
    ├── client_architecture.md
    └── component_breakdown.md
```

---

## What's Done

- [x] React frontend — fully complete as a monolithic component (`LiveStatsPageDual.tsx`)
- [x] `main.py` — partial: Teams, Players, Matches, PlayerMatchStats, and PlayByPlay routes exist
- [x] `src/services/api.ts` — referenced by frontend but implementation status unknown

## Outstanding Work

### Backend — High Priority
- [ ] `database.py` — Supabase `PostgresqlDatabase` connection not yet implemented
- [ ] `models.py` — Peewee model definitions needed for all 8 tables
- [ ] `schemas.py` — Pydantic schemas for `RefereeCall`, `Possession`, `PlayerNote` not yet defined
- [ ] `main.py` — Routes for `/referee-calls`, `/possessions`, `/notes` not yet implemented
- [ ] `auth.py` — No authentication layer exists

### Frontend — Recommended Refactor
- [ ] Break `LiveStatsPageDual.tsx` into component files (see `component_breakdown.md`)
- [ ] Implement `src/services/api.ts` to match all backend endpoints
- [ ] Extract `useGameClock` and `useStatLogger` hooks
