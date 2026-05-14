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
  majorFouls?: number;
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

export interface Play {
  id: string;
  name: string;
  timestamp: string;
  success: boolean;
  team: 'ucDavis' | 'opponent';
}

export interface HeatmapData {
  ucDavis: { x: number; y: number; type: 'shot' | 'goal' | 'assist'; formation: '4-2' | '3-3' }[];
  opponent: { x: number; y: number; type: 'shot' | 'goal' | 'assist'; formation: '4-2' | '3-3' }[];
}

export interface RefereeCall {
  id: string;
  type:
    | 'yellow-card'
    | 'red-card'
    | 'ejection'
    | 'minor-foul'
    | 'major-foul'
    | 'simulation'
    | 'offensive-foul'
    | 'defensive-foul'
    | 'brutality'
    | 'timeout';
  playerName?: string;
  playerId?: number;
  team?: 'ucDavis' | 'opponent';
  timestamp: string;
  gameTime: number;
  quarter: number;
}

export interface HistoryState {
  ucDavisPlayerStats: PlayerStat[];
  opponentPlayerStats: PlayerStat[];
  teamStats: TeamStat;
  plays: Play[];
  currentQuarter: number;
  heatmapData: HeatmapData;
  refereeCalls: RefereeCall[];
}

export interface PossessionEvent {
  id: string;
  team: 'ucDavis' | 'opponent';
  timestamp: number;
  duration: number;
  event: string;
}

export interface ActiveEjection {
  playerId: number;
  playerName: string;
  team: 'ucDavis' | 'opponent';
  timeRemaining: number;
  startTime: number;
}
