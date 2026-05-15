import { computePerformanceScore, scoreTier, type StatRow } from './performanceScore';

export type GamePoint = {
  player_id: number;
  player_name: string;
  match_id: number;
  time_in_pool: number;
  performance_score: number;
};

export type RapmEntry = {
  player_id: number;
  name: string;
  rapm: number;
  games: number;
  avg_ppi: number;
};

export type RegressionSummary = {
  pearson_r: number;
  slope: number;
  intercept: number;
  n: number;
  insight: string;
};

export type SubRecommendation = {
  player_name: string;
  reason: string;
  priority: 'high' | 'medium';
};

/** Regularized rating vs team mean — presentation-style RAPM proxy (not full stint RAPM). */
export function computeSimulatedRAPM(
  players: { id: number; name: string; gameScores: number[] }[],
  shrinkGames = 3,
): RapmEntry[] {
  const withAvg = players
    .filter((p) => p.gameScores.length > 0)
    .map((p) => ({
      player_id: p.id,
      name: p.name,
      games: p.gameScores.length,
      avg_ppi: p.gameScores.reduce((a, b) => a + b, 0) / p.gameScores.length,
    }));
  if (!withAvg.length) return [];
  const teamMean = withAvg.reduce((s, p) => s + p.avg_ppi, 0) / withAvg.length;
  const spread = Math.max(...withAvg.map((p) => p.avg_ppi)) - Math.min(...withAvg.map((p) => p.avg_ppi)) || 1;

  return withAvg
    .map((p) => {
      const raw = p.avg_ppi - teamMean;
      const reg = p.games / (p.games + shrinkGames);
      const rapm = Math.round(((raw / spread) * 4.5 * reg + Number.EPSILON) * 10) / 10;
      return { ...p, rapm };
    })
    .sort((a, b) => b.rapm - a.rapm);
}

export function linearRegression(points: { x: number; y: number }[]): RegressionSummary {
  const n = points.length;
  if (n < 3) {
    return {
      pearson_r: 0,
      slope: 0,
      intercept: 0,
      n,
      insight: 'Need at least 3 logged games with play time to fit regression.',
    };
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const slope = denX ? num / denX : 0;
  const intercept = my - slope * mx;
  const pearson_r = denX && denY ? num / Math.sqrt(denX * denY) : 0;
  const r = Math.round(pearson_r * 1000) / 1000;
  let insight: string;
  if (Math.abs(r) < 0.2) {
    insight = 'Play time and performance score are weakly related in this sample — lineup fit may matter more than minutes.';
  } else if (r > 0.2) {
    insight = 'More pool time tends to align with higher performance scores — consider extending minutes for top regressors.';
  } else {
    insight = 'Higher minutes correlate with lower scores in this sample — review substitution timing for fatigued players.';
  }
  return { pearson_r: r, slope, intercept, n, insight };
}

export function buildSubstitutionRecommendations(
  latestMatch: { player_name: string; score: number; time_in_pool: number; tier: string }[],
): SubRecommendation[] {
  if (!latestMatch.length) return [];
  const medianTime =
    [...latestMatch].sort((a, b) => a.time_in_pool - b.time_in_pool)[Math.floor(latestMatch.length / 2)]
      ?.time_in_pool ?? 0;
  const recs: SubRecommendation[] = [];
  for (const p of latestMatch) {
    if (p.score < 40 && p.time_in_pool >= medianTime) {
      recs.push({
        player_name: p.player_name,
        reason: `Performance index ${p.score} (${p.tier}) with above-median minutes — consider a fresh matchup.`,
        priority: 'high',
      });
    } else if (p.score < 50 && p.time_in_pool > medianTime * 1.2) {
      recs.push({
        player_name: p.player_name,
        reason: `Below-average index with heavy minutes logged.`,
        priority: 'medium',
      });
    }
  }
  return recs.slice(0, 6);
}

export function statRowToScore(row: StatRow & { score?: number }): number {
  if (row.score != null && row.score > 0) return row.score;
  return computePerformanceScore(row);
}

export function toGamePoints(
  stats: (StatRow & {
    player_id: number;
    match_id: number;
    time_in_pool?: number;
    score?: number;
  })[],
  names: Map<number, string>,
): GamePoint[] {
  return stats
    .filter((s) => (s.time_in_pool ?? 0) > 0)
    .map((s) => ({
      player_id: s.player_id,
      player_name: names.get(s.player_id) ?? `Player #${s.player_id}`,
      match_id: s.match_id,
      time_in_pool: s.time_in_pool ?? 0,
      performance_score: statRowToScore(s),
    }));
}

export { scoreTier };
