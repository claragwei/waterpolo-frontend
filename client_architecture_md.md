# Client Architecture

## Status

> ⚠️ **The frontend logic is fully complete in `LiveStatsPageDual.tsx`. Do not rewrite or break existing functionality.**
>
> The recommended work is: (1) implement `src/services/api.ts` to wire up the backend, and (2) optionally refactor the monolith into components per `component_breakdown.md`. All behavior must remain identical after any refactor.

---

## Current State: `LiveStatsPageDual.tsx`

The entire live tracking UI lives in one ~900-line component. It is fully functional. This is the source of truth for all frontend behavior.

### State Inventory

| State Variable | Type | Purpose |
|---|---|---|
| `matchId` | `number \| null` | Set after `POST /api/matches` succeeds |
| `isGameActive` | `boolean` | Whether game has been started |
| `isPaused` | `boolean` | Pauses clock and possession timers |
| `gameTime` | `number` | Seconds elapsed in current quarter |
| `currentQuarter` | `number` | 1–4 |
| `isInBreak` | `boolean` | True during inter-quarter breaks |
| `breakTimeRemaining` | `number` | Countdown seconds during break |
| `ucDavisPlayerStats` | `PlayerStat[]` | Full stat objects for UC Davis roster |
| `opponentPlayerStats` | `PlayerStat[]` | Full stat objects for opponent roster |
| `teamStats` | `TeamStat` | FCO, FCD, CAO, CAD, AG, AGD, 6v5, 5v6, 7v6, 6v7, possession times |
| `selectedPlayer` | `number \| null` | `playerId` of the currently tracked player |
| `currentPossession` | `'ucDavis' \| 'opponent' \| null` | Which team has possession |
| `isPossessionActive` | `boolean` | Whether possession timer is running |
| `currentPossessionStart` | `number` | Possession time value when current possession began |
| `possessionTimeline` | `PossessionEvent[]` | Log of completed possessions with duration + outcome |
| `activeEjections` | `ActiveEjection[]` | Players currently serving 20-second ejection timers |
| `heatmapData` | `HeatmapData` | Shot/goal/assist pins by team, with `(x, y, type, formation)` |
| `plays` | `Play[]` | Local play-by-play log |
| `refereeCalls` | `RefereeCall[]` | Referee call log |
| `refereeCallCounts` | `Record<callType, number>` | Badge counts on referee call buttons |
| `refereeName` | `string` | Input field for referee name |
| `history` / `historyIndex` | `HistoryState[]` / `number` | Undo/redo stack (max 50 entries) |
| `formation` | `'4-2' \| '3-3'` | Active formation filter for heatmap |
| `currentNote` | `string` | Controlled input for player note text |

### Modal State Variables

| Variable | Controls |
|---|---|
| `showHeatmapModal` + `pendingAction` | Shot/goal/assist location modal |
| `showRefereeCallModal` + `pendingRefereeCall` | Referee call player selection modal |
| `showSubModal` + `subTeam` + `firstSelectedPlayer` + `secondSelectedPlayer` | Substitution modal |
| `showPlayerEditModal` + `editingUcDavisPlayers` + `editingOpponentPlayers` | Pre-game player name/number editor |

---

## API Service (`src/services/api.ts`) — NEEDS IMPLEMENTATION

The frontend imports `{ api }` from `../services/api` and calls:

```typescript
// handleStartGame — opponent lookup-or-create
api.getTeams({ name: opponentTeamName })
api.createTeam({ name, short_name, is_uc_davis })
api.createMatch({ uc_davis_team_id, opponent_team_id, match_date, location })

// updatePlayerStat, handleTurnover, handleSteal, handlePinDrop — mid-game delta
api.updateMatchStats(matchId, playerId, delta)  // POST — increments

// handleEndGame — end-of-game full sync
api.upsertMatchStats(matchId, playerId, fullStats)  // PUT — overwrites

// handleSaveGame, handleEndGame — score + status sync
api.updateMatch(matchId, { status, uc_davis_score, opponent_score, ... })

// updateTeamStat, handleTurnover, handleSteal, handlePinDrop, handleSubstitution
api.createPlay(matchId, playData)

// addRefereeCall — now uses dedicated endpoint with player_id FK
api.createRefereeCall(matchId, callData)

// handleAddNote
api.createNote(matchId, noteData)
```

See `frontend_patches.ts` for the full `api.ts` implementation.

---

## TypeScript Interfaces

These match the shapes used inside `LiveStatsPageDual.tsx`:

```typescript
// src/types/index.ts

export interface PlayerStat {
  playerId: number;
  playerName: string;
  jerseyNumber: number;
  shots: number;
  goals: number;
  penalties: number;
  turnovers: number;
  rebounds: number;
  assists: number;
  blocks: number;
  tippedPasses: number;
  sprints: number;
  steals: number;
  hustle: number;
  exclusions: number;
  draws: number;
  isActive: boolean;
  notes?: string[];
}

export interface TeamStat {
  FCO: number;
  FCD: number;
  CAO: number;
  CAD: number;
  AG: number;
  AGD: number;
  sixOnFive: number;
  fiveOnSix: number;
  sevenOnSix: number;
  sixOnSeven: number;
  possessionTimeUCDavis: number;
  possessionTimeOpponent: number;
}

export interface RefereeCall {
  id: string;
  type: 'yellow-card' | 'red-card' | 'ejection' | 'offensive-foul' | 'defensive-foul' | 'brutality' | 'timeout';
  playerName?: string;
  team?: 'ucDavis' | 'opponent';
  timestamp: string;  // "MM:SS" display string
  gameTime: number;   // raw seconds
  quarter: number;
}

export interface ActiveEjection {
  playerId: number;
  playerName: string;
  team: 'ucDavis' | 'opponent';
  timeRemaining: number;
  startTime: number;
}

export interface PossessionEvent {
  id: string;
  team: 'ucDavis' | 'opponent';
  timestamp: number;
  duration: number;
  event: string;  // 'Goal' | 'Turnover' | 'Steal'
}

export interface HeatmapData {
  ucDavis: { x: number; y: number; type: 'shot' | 'goal' | 'assist'; formation: '4-2' | '3-3' }[];
  opponent: { x: number; y: number; type: 'shot' | 'goal' | 'assist'; formation: '4-2' | '3-3' }[];
}
```

---

## Key Behavioral Contracts (Do Not Break)

These behaviors are implemented in `LiveStatsPageDual.tsx` and must be preserved through any refactor:

1. **Possession auto-switches** after `handleTurnover`, `handleSteal`, and a goal via `handlePinDrop`. The switch happens in a 500ms `setTimeout` and clears `selectedPlayer`.
2. **Ejections clear** when a goal is scored OR when possession changes.
3. **Referee call modal pauses the game** (`setIsPaused(true)`) before opening.
4. **Heatmap goals** also increment `shots` (a goal always counts as a shot).
5. **Undo/redo** captures `ucDavisPlayerStats`, `opponentPlayerStats`, `teamStats`, `plays`, `currentQuarter`, `heatmapData`, and `refereeCalls` together as atomic snapshots. Stack is capped at 50. Keyboard shortcuts: `Ctrl+Z` / `Ctrl+Y`.
6. **Quarter breaks** fire automatically when `gameTime === 480`. Durations: Q1→Q2: 120s, halftime: 300s, Q3→Q4: 120s. The break timer auto-advances to the next quarter on expiry.
7. **Player editing** happens in a modal before game start; edits are applied to `ucDavisPlayerStats` / `opponentPlayerStats` on save.
8. **API calls are always fire-and-forget** with `try/catch` — errors log to console but never block the UI. The one exception is `handleEndGame`, which uses `Promise.allSettled` (not `Promise.all`) so a single failed stat sync does not abort the rest.
9. **Score is derived, never stored as state.** `ucDavisScore` and `opponentScore` are computed via `.reduce()` from player goal totals at the point of use (`handleSaveGame`, `handleEndGame`, the End Game confirm dialog). Do not add score as a separate `useState`.
10. **End Game is distinct from Reset.** `handleEndGame` syncs all stats to the backend, marks the match `completed`, then calls `handleResetGame`. The Reset button alone does NOT call the backend — it only clears local state.

---

## Running Locally

```bash
cd frontend
npm install
cp .env.example .env  # set VITE_API_URL and VITE_API_KEY
npm run dev
# App: http://localhost:5173
```
