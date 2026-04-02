# Component Breakdown

## Overview

`LiveStatsPageDual.tsx` is a ~900-line monolithic component. All logic is correct and complete — the goal of this refactor is **organization only**. No behavior should change. The component should be split along natural UI section boundaries, with shared state lifted to the page component and passed down as props.

---

## Guiding Principles

- **Lift state, don't duplicate it.** All state stays in `LiveStatsPageDual.tsx` (or a `useGameState` hook). Child components receive values and callbacks as props.
- **One responsibility per file.** Each component renders one visual section of the page.
- **Modals are standalone components.** Each modal is self-contained with its own file.
- **No behavior changes.** If a refactor causes any functional difference, it's wrong.

---

## Proposed Component Tree

```
LiveStatsPageDual.tsx  (orchestrator — owns all state)
├── GameHeader.tsx
├── PossessionTimer.tsx
├── ActiveEjections.tsx
├── TeamIndicatorBanner.tsx
├── PlayerGrid.tsx
├── StatActionPanel.tsx          (only renders when selectedPlayer !== null)
│   ├── CurrentPlayerHeader.tsx
│   ├── ScoringActions.tsx
│   ├── DefensiveActions.tsx
│   └── PlayerNotesPanel.tsx
├── BottomPanels.tsx             (3-column grid)
│   ├── TeamSituations.tsx
│   ├── RefereePanel.tsx
│   └── PossessionTimeline.tsx
├── StatsTable.tsx               (both teams summary)
└── Modals/
    ├── PlayerEditModal.tsx
    ├── HeatmapModal.tsx
    ├── RefereeCallModal.tsx
    └── SubstitutionModal.tsx
```

---

## Component Specifications

### `GameHeader.tsx`
Renders the top bar: title, Undo/Redo buttons, Edit Players, Start/Pause/Resume/Save/Reset buttons, and the blue game info bar (clock, quarter, status badge, quarter +/- buttons).

**Props:**
```typescript
interface GameHeaderProps {
  isGameActive: boolean;
  isPaused: boolean;
  isInBreak: boolean;
  gameTime: number;
  breakTimeRemaining: number;
  currentQuarter: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onStartGame: () => void;
  onPauseGame: () => void;
  onSaveGame: () => void;
  onResetGame: () => void;
  onEditPlayers: () => void;
  onQuarterChange: (q: number) => void;
  onSkipBreak: () => void;
}
```

---

### `PossessionTimer.tsx`
Renders the two possession cards (UC Davis / Opponent) with Start/Stop buttons and running timers.

**Props:**
```typescript
interface PossessionTimerProps {
  possessionTimeUCDavis: number;
  possessionTimeOpponent: number;
  currentPossession: 'ucDavis' | 'opponent' | null;
  isPossessionActive: boolean;
  isGameActive: boolean;
  onSetPossession: (team: 'ucDavis' | 'opponent' | null) => void;
}
```

---

### `ActiveEjections.tsx`
Renders the orange ejection warning cards. Only mounts when `activeEjections.length > 0`.

**Props:**
```typescript
interface ActiveEjectionsProps {
  activeEjections: ActiveEjection[];
}
```

---

### `TeamIndicatorBanner.tsx`
The colored banner ("Now Tracking: UC Davis"). Only renders when `currentPossession !== null`.

**Props:**
```typescript
interface TeamIndicatorBannerProps {
  currentPossession: 'ucDavis' | 'opponent';
}
```

---

### `PlayerGrid.tsx`
Renders both player grids (UC Davis + Opponent) with jersey number buttons, IN badges, ejection countdown badges, and the substitution buttons at the bottom.

**Props:**
```typescript
interface PlayerGridProps {
  ucDavisPlayerStats: PlayerStat[];
  opponentPlayerStats: PlayerStat[];
  selectedPlayer: number | null;
  currentPossession: 'ucDavis' | 'opponent' | null;
  isPossessionActive: boolean;
  activeEjections: ActiveEjection[];
  onSelectPlayer: (playerId: number, team: 'ucDavis' | 'opponent') => void;
  onOpenSubModal: (team: 'ucDavis' | 'opponent') => void;
}
```

**Note:** `onSelectPlayer` should call both `setSelectedPlayer` and `setCurrentPossession` in the parent.

---

### `StatActionPanel.tsx`
The container that renders when `selectedPlayer !== null`. Wraps the player header card, scoring buttons, defensive buttons, and notes panel.

**Props:**
```typescript
interface StatActionPanelProps {
  selectedPlayer: number;
  currentPossession: 'ucDavis' | 'opponent';
  activePlayerStats: PlayerStat[];
  gameTime: number;
  currentQuarter: number;
  currentNote: string;
  onCurrentNoteChange: (note: string) => void;
  onShotClick: (playerId: number) => void;
  onGoalClick: (playerId: number) => void;
  onAssistClick: (playerId: number) => void;
  onTurnover: (playerId: number) => void;
  onSteal: (playerId: number) => void;
  onUpdateStat: (playerId: number, stat: string, increment?: number) => void;
  onAddNote: () => void;
}
```

---

### `TeamSituations.tsx`
The condensed 2×5 grid of team situation buttons (FCO, FCD, CAO, CAD, AG, AGD, 6v5, 5v6, 7v6, 6v7) with badge counters.

**Props:**
```typescript
interface TeamSituationsProps {
  teamStats: TeamStat;
  onUpdateTeamStat: (stat: keyof TeamStat) => void;
}
```

---

### `RefereePanel.tsx`
Referee name input, the 7 call-type buttons with counters, and the scrollable calls timeline.

**Props:**
```typescript
interface RefereePanelProps {
  refereeName: string;
  refereeCallCounts: Record<string, number>;
  refereeCalls: RefereeCall[];
  onRefereeNameChange: (name: string) => void;
  onRefereeCall: (type: RefereeCall['type']) => void;
}
```

---

### `PossessionTimeline.tsx`
The scrollable list of completed possession events.

**Props:**
```typescript
interface PossessionTimelineProps {
  possessionTimeline: PossessionEvent[];
}
```

---

### `StatsTable.tsx`
The two-column summary table (UC Davis / Opponent) showing G/A/S per player.

**Props:**
```typescript
interface StatsTableProps {
  ucDavisPlayerStats: PlayerStat[];
  opponentPlayerStats: PlayerStat[];
}
```

---

### `PlayerEditModal.tsx`
Pre-game modal for editing player names, jersey numbers, and opponent team name. Controlled by `showPlayerEditModal`.

**Props:**
```typescript
interface PlayerEditModalProps {
  isOpen: boolean;
  editingUcDavisPlayers: PlayerStat[];
  editingOpponentPlayers: PlayerStat[];
  opponentTeamName: string;
  onUcDavisPlayersChange: (players: PlayerStat[]) => void;
  onOpponentPlayersChange: (players: PlayerStat[]) => void;
  onOpponentTeamNameChange: (name: string) => void;
  onSave: () => void;
  onClose: () => void;
}
```

---

### `HeatmapModal.tsx`
The pool diagram modal for selecting shot/goal/assist locations. Includes formation toggle and renders existing pins.

**Props:**
```typescript
interface HeatmapModalProps {
  isOpen: boolean;
  pendingAction: { type: 'shot' | 'goal' | 'assist'; playerId: number; playerName: string; team: 'ucDavis' | 'opponent' } | null;
  heatmapData: HeatmapData;
  formation: '4-2' | '3-3';
  onFormationChange: (f: '4-2' | '3-3') => void;
  onPinDrop: (x: number, y: number) => void;
  onClose: () => void;
}
```

**Note:** `getPlayerPositions` helper function should move into this file since it's only used here.

---

### `RefereeCallModal.tsx`
The player-selection modal that appears after a referee call button is pressed.

**Props:**
```typescript
interface RefereeCallModalProps {
  isOpen: boolean;
  pendingRefereeCall: RefereeCall['type'] | null;
  ucDavisPlayerStats: PlayerStat[];
  opponentPlayerStats: PlayerStat[];
  onConfirm: (playerName?: string, team?: 'ucDavis' | 'opponent') => void;
  onClose: () => void;
}
```

---

### `SubstitutionModal.tsx`
The player swap modal for both teams.

**Props:**
```typescript
interface SubstitutionModalProps {
  isOpen: boolean;
  subTeam: 'ucDavis' | 'opponent' | null;
  ucDavisPlayerStats: PlayerStat[];
  opponentPlayerStats: PlayerStat[];
  opponentTeamName: string;
  firstSelectedPlayer: number | null;
  secondSelectedPlayer: number | null;
  onFirstPlayerSelect: (id: number | null) => void;
  onSecondPlayerSelect: (id: number | null) => void;
  onConfirm: () => void;
  onClose: () => void;
}
```

---

## Suggested Extraction Order

Do these in sequence. Each step is independently testable:

1. **Modals first** — they have the least entanglement with the rest of the UI. Extract `PlayerEditModal`, `RefereeCallModal`, `SubstitutionModal`, then `HeatmapModal`. After each extraction, verify the modal still opens, functions correctly, and closes.

2. **Leaf display components** — `ActiveEjections`, `TeamIndicatorBanner`, `PossessionTimeline`, `StatsTable`. Pure display; no callbacks needed beyond what they already receive.

3. **`TeamSituations` and `RefereePanel`** — small callback surface, straightforward to lift.

4. **`PlayerGrid`** — slightly complex due to ejection badge logic, but self-contained once `isPlayerEjected` is passed as a helper or inlined.

5. **`StatActionPanel`** — extract the 4 sub-sections together, then optionally sub-divide.

6. **`PossessionTimer`** and **`GameHeader`** last — these have the most prop surface area and touch the most state.

---

## Optional: `useGameState` Hook

If `LiveStatsPageDual.tsx` still feels too large after component extraction, consolidate all state and derived values into a custom hook:

```typescript
// src/hooks/useGameState.ts
export function useGameState() {
  // All useState declarations
  // All useEffect (clock, possession timer, ejection countdown, break timer, history init)
  // All handler functions (updatePlayerStat, handleTurnover, etc.)
  
  return {
    // State values
    matchId, isGameActive, isPaused, gameTime, currentQuarter, ...
    // Handlers
    handleStartGame, handlePauseGame, updatePlayerStat, ...
    // Derived values
    activePlayerStats, activeTeamName, canUndo, canRedo
  };
}
```

`LiveStatsPageDual.tsx` then becomes a thin layout shell:
```typescript
export default function LiveStatsPage() {
  const state = useGameState();
  return (
    <div className="p-8 bg-[#F5F7FA] min-h-screen">
      <GameHeader {...state} />
      <PossessionTimer {...state} />
      ...
    </div>
  );
}
```
