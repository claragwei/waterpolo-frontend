import type { MatchReportBundle } from './aggregateMatchReport';

export const MOCK_OPPONENT = 'Stanford';

export const mockGameData = {
  currentQuarter: 2 as const,
  ucDavisScore: 5,
  opponentScore: 3,
  opponentName: MOCK_OPPONENT,
  quarterStats: {
    Q1: {
      ucDavisGoals: 3,
      opponentGoals: 2,
      ucDavisPossessionTime: 250,
      opponentPossessionTime: 230,
      totalShots: { ucDavis: 8, opponent: 6 },
      topScorers: [
        { name: 'Alex Martinez', goals: 2, shots: 3, player_id: 1 },
        { name: 'Jake Thompson', goals: 1, shots: 2, player_id: 2 },
      ],
      refereeCalls: { yellowCards: 1, ejections: 2, penalties: 1 },
    },
    Q2: {
      ucDavisGoals: 2,
      opponentGoals: 1,
      ucDavisPossessionTime: 180,
      opponentPossessionTime: 180,
      totalShots: { ucDavis: 5, opponent: 4 },
      topScorers: [
        { name: 'Ryan Chen', goals: 1, shots: 2, player_id: 3 },
        { name: 'Marcus Wilson', goals: 1, shots: 1, player_id: 4 },
      ],
      refereeCalls: { yellowCards: 0, ejections: 1, penalties: 0 },
    },
  },
};

export function buildMockReportBundle(kind: 'quarter' | 'halftime'): MatchReportBundle {
  const q1 = mockGameData.quarterStats.Q1;
  const q2 = mockGameData.quarterStats.Q2;
  const uc =
    kind === 'halftime'
      ? q1.ucDavisGoals + q2.ucDavisGoals
      : mockGameData.quarterStats[`Q${mockGameData.currentQuarter}` as 'Q1' | 'Q2'].ucDavisGoals;
  const opp =
    kind === 'halftime'
      ? q1.opponentGoals + q2.opponentGoals
      : mockGameData.quarterStats[`Q${mockGameData.currentQuarter}` as 'Q1' | 'Q2'].opponentGoals;

  const scorers = [...q1.topScorers, ...q2.topScorers];
  const byPlayer = new Map<number, { goals: number; shots: number; assists: number }>();
  for (const s of scorers) {
    const cur = byPlayer.get(s.player_id) ?? { goals: 0, shots: 0, assists: 0 };
    cur.goals += s.goals;
    cur.shots += s.shots;
    byPlayer.set(s.player_id, cur);
  }

  return {
    match: {
      id: 0,
      uc_davis_team_id: 1,
      opponent_team_id: 2,
      match_date: new Date().toISOString(),
      uc_davis_score: uc,
      opponent_score: opp,
      status: kind === 'halftime' ? 'halftime' : 'in_progress',
      current_quarter: mockGameData.currentQuarter,
    },
    opponent_name: mockGameData.opponentName,
    player_stats: [...byPlayer.entries()].map(([player_id, s]) => ({
      player_id,
      goals: s.goals,
      shots: s.shots,
      assists: s.assists,
      steals: 0,
      blocks: 0,
      turnovers: 0,
    })),
    plays: Array.from({ length: 24 }, (_, i) => ({
      quarter: (i % 2) + 1,
      game_time: i * 15,
      event_type: i % 3 === 0 ? 'goal' : 'shot',
      player_id: scorers[i % scorers.length]?.player_id ?? 1,
      team_id: 1,
    })),
    referee_calls: [],
    possessions: Array.from({ length: 8 }, (_, i) => ({
      quarter: 1,
      start_time: i * 60,
      end_time: i * 60 + 45,
      team_id: i % 2 === 0 ? 1 : 2,
    })),
  };
}

export function mockPlayerNames(): Map<number, string> {
  const m = new Map<number, string>();
  for (const q of [mockGameData.quarterStats.Q1, mockGameData.quarterStats.Q2]) {
    for (const s of q.topScorers) {
      m.set(s.player_id, s.name);
    }
  }
  return m;
}
