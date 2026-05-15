import { api } from '../services/api';
import {
  buildSubstitutionRecommendations,
  computeSimulatedRAPM,
  linearRegression,
  statRowToScore,
  scoreTier,
  toGamePoints,
  type RapmEntry,
  type RegressionSummary,
  type SubRecommendation,
} from './playerAnalytics';

export type TeamAnalyticsSnapshot = {
  rapm: RapmEntry[];
  regression: RegressionSummary;
  subs: SubRecommendation[];
  avgRapm: number;
  gamePoints: { player_name: string; time_min: number; ppi: number }[];
  latestMatchLabel: string;
  fromLiveData: boolean;
};

const DEFAULT_TEAM = Number(import.meta.env.VITE_UCD_TEAM_ID ?? 1);

export async function loadTeamAnalytics(): Promise<TeamAnalyticsSnapshot> {
  const [players, matches] = await Promise.all([
    api.getPlayers({ team_id: DEFAULT_TEAM, is_active: true }),
    api.getMatches({ status: 'completed', limit: 12 }),
  ]);
  const names = new Map(players.map((p) => [p.id, p.name]));

  const allStats: {
    player_id: number;
    match_id: number;
    goals: number;
    shots: number;
    assists: number;
    steals: number;
    rebounds: number;
    sprints: number;
    hustle: number;
    draws: number;
    time_in_pool: number;
    score?: number;
  }[] = [];

  for (const m of matches) {
    try {
      const rows = await api.getMatchStats(m.id);
      for (const r of rows) {
        allStats.push({
          player_id: r.player_id,
          match_id: m.id,
          goals: r.goals,
          shots: r.shots,
          assists: r.assists,
          steals: r.steals,
          rebounds: (r as { rebounds?: number }).rebounds ?? 0,
          sprints: (r as { sprints?: number }).sprints ?? 0,
          hustle: (r as { hustle?: number }).hustle ?? 0,
          draws: (r as { draws?: number }).draws ?? 0,
          time_in_pool: (r as { time_in_pool?: number }).time_in_pool ?? 0,
          score: (r as { score?: number }).score,
        });
      }
    } catch {
      /* skip match */
    }
  }

  if (!allStats.length) {
    return fallbackMockAnalytics(players);
  }

  const scoresByPlayer = new Map<number, number[]>();
  for (const s of allStats) {
    const sc = statRowToScore(s);
    const arr = scoresByPlayer.get(s.player_id) ?? [];
    arr.push(sc);
    scoresByPlayer.set(s.player_id, arr);
  }

  const rapm = computeSimulatedRAPM(
    players.map((p) => ({
      id: p.id,
      name: p.name,
      gameScores: scoresByPlayer.get(p.id) ?? [],
    })),
  );

  const gamePoints = toGamePoints(allStats, names);
  const regression = linearRegression(
    gamePoints.map((g) => ({ x: g.time_in_pool / 60, y: g.performance_score })),
  );

  const latest = matches[0];
  let subs: SubRecommendation[] = [];
  let latestMatchLabel = 'Latest completed match';
  if (latest) {
    const opp = await api.getTeams().catch(() => []);
    const oppTeam = opp.find((t) => t.id === latest.opponent_team_id);
    latestMatchLabel = `vs ${oppTeam?.name ?? 'Opponent'} — ${new Date(latest.match_date).toLocaleDateString()}`;
    const latestRows = allStats.filter((s) => s.match_id === latest.id);
    subs = buildSubstitutionRecommendations(
      latestRows.map((s) => ({
        player_name: names.get(s.player_id) ?? `#${s.player_id}`,
        score: statRowToScore(s),
        time_in_pool: s.time_in_pool,
        tier: scoreTier(statRowToScore(s)),
      })),
    );
  }

  const avgRapm = rapm.length ? rapm.reduce((a, b) => a + b.rapm, 0) / rapm.length : 0;

  return {
    rapm,
    regression,
    subs,
    avgRapm,
    gamePoints: gamePoints.map((g) => ({
      player_name: g.player_name,
      time_min: Math.round((g.time_in_pool / 60) * 10) / 10,
      ppi: g.performance_score,
    })),
    latestMatchLabel,
    fromLiveData: true,
  };
}

function fallbackMockAnalytics(
  players: { id: number; name: string }[],
): TeamAnalyticsSnapshot {
  const mockRapm = [
    { player_id: 1, name: 'Alex Martinez', rapm: 3.8, games: 7, avg_ppi: 72 },
    { player_id: 2, name: 'Jake Thompson', rapm: 2.4, games: 6, avg_ppi: 65 },
    { player_id: 3, name: 'Ryan Chen', rapm: 1.1, games: 7, avg_ppi: 58 },
    { player_id: 4, name: 'Marcus Wilson', rapm: -0.6, games: 5, avg_ppi: 48 },
  ].filter((m) => players.some((p) => p.name === m.name) || players.length === 0);

  return {
    rapm: mockRapm.length ? mockRapm : computeSimulatedRAPM([]),
    regression: {
      pearson_r: -0.063,
      slope: -0.42,
      intercept: 68,
      n: 84,
      insight:
        'Demo data (Stanford mock). Log Live Stats with play time to replace with your season regression.',
    },
    subs: [
      {
        player_name: 'Marcus Wilson',
        reason: 'Demo: below-average index with heavy minutes — consider rotation.',
        priority: 'medium',
      },
    ],
    avgRapm: 1.86,
    gamePoints: [],
    latestMatchLabel: 'Demo — connect API for live data',
    fromLiveData: false,
  };
}
