/** Types aligned with GET /api/reports/match/{id}/bundle */

export interface BundleMatch {
  id: number;
  uc_davis_team_id: number;
  opponent_team_id: number;
  match_date: string;
  location?: string | null;
  uc_davis_score: number;
  opponent_score: number;
  status: string;
  current_quarter: number;
  game_time?: string | null;
  referee_name?: string | null;
}

export interface BundlePlay {
  quarter: number;
  game_time: number;
  event_type: string;
  player_id: number | null;
  team_id: number | null;
}

export interface BundlePossession {
  quarter: number;
  start_time: number;
  end_time: number | null;
  team_id: number;
}

export interface BundlePlayerStat {
  player_id: number;
  shots: number;
  goals: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
}

export interface MatchReportBundle {
  match: BundleMatch;
  opponent_name: string;
  player_stats: BundlePlayerStat[];
  plays: BundlePlay[];
  referee_calls: { quarter: number; game_time: number; call_type: string }[];
  possessions: BundlePossession[];
}

export interface QuarterAgg {
  ucGoals: number;
  oppGoals: number;
  ucShots: number;
  oppShots: number;
  ucPossessionSec: number;
  oppPossessionSec: number;
}

const UCD_TEAM_ID = 1;

function emptyQuarter(): QuarterAgg {
  return {
    ucGoals: 0,
    oppGoals: 0,
    ucShots: 0,
    oppShots: 0,
    ucPossessionSec: 0,
    oppPossessionSec: 0,
  };
}

/** Per-quarter aggregates from plays + possessions (UC Davis = team_id 1). */
export function aggregateQuarters(bundle: MatchReportBundle): Record<1 | 2 | 3 | 4, QuarterAgg> {
  const q: Record<number, QuarterAgg> = {
    1: emptyQuarter(),
    2: emptyQuarter(),
    3: emptyQuarter(),
    4: emptyQuarter(),
  };

  for (const p of bundle.plays) {
    const qn = Math.min(4, Math.max(1, p.quarter)) as 1 | 2 | 3 | 4;
    const row = q[qn];
    const et = (p.event_type || '').toLowerCase();
    const isUc = p.team_id === UCD_TEAM_ID;
    const isOpp = p.team_id != null && p.team_id !== UCD_TEAM_ID;
    if (et === 'goal') {
      if (isUc) row.ucGoals += 1;
      else if (isOpp) row.oppGoals += 1;
      if (isUc) row.ucShots += 1;
      else if (isOpp) row.oppShots += 1;
    } else if (et === 'shot') {
      if (isUc) row.ucShots += 1;
      else if (isOpp) row.oppShots += 1;
    }
  }

  for (const pos of bundle.possessions) {
    if (pos.end_time == null) continue;
    const qn = Math.min(4, Math.max(1, pos.quarter)) as 1 | 2 | 3 | 4;
    const dur = Math.max(0, pos.end_time - pos.start_time);
    if (pos.team_id === UCD_TEAM_ID) q[qn].ucPossessionSec += dur;
    else q[qn].oppPossessionSec += dur;
  }

  return q as Record<1 | 2 | 3 | 4, QuarterAgg>;
}

export function topScorersForQuarter(
  bundle: MatchReportBundle,
  quarter: number,
  playersById: Map<number, string>,
  limit = 5,
): { name: string; goals: number; shots: number }[] {
  const byPlayer = new Map<number, { goals: number; shots: number }>();
  for (const p of bundle.plays) {
    if (p.quarter !== quarter || p.player_id == null) continue;
    const et = (p.event_type || '').toLowerCase();
    if (!byPlayer.has(p.player_id)) byPlayer.set(p.player_id, { goals: 0, shots: 0 });
    const row = byPlayer.get(p.player_id)!;
    if (et === 'goal') {
      row.goals += 1;
      row.shots += 1;
    } else if (et === 'shot') {
      row.shots += 1;
    }
  }
  return [...byPlayer.entries()]
    .map(([id, s]) => ({
      name: playersById.get(id) ?? `Player #${id}`,
      goals: s.goals,
      shots: s.shots,
    }))
    .filter((r) => r.goals > 0 || r.shots > 0)
    .sort((a, b) => b.goals - a.goals || b.shots - a.shots)
    .slice(0, limit);
}

export function refereeAggForQuarter(
  bundle: MatchReportBundle,
  quarter: number,
): { yellowCards: number; ejections: number; penalties: number } {
  let yellowCards = 0;
  let ejections = 0;
  let penalties = 0;
  for (const r of bundle.referee_calls) {
    if (r.quarter !== quarter) continue;
    const t = (r.call_type || '').toLowerCase();
    if (t.includes('yellow')) yellowCards += 1;
    else if (t.includes('eject') || t.includes('red')) ejections += 1;
    else if (t.includes('penalt')) penalties += 1;
  }
  return { yellowCards, ejections, penalties };
}

export function combineQuarters(a: QuarterAgg, b: QuarterAgg): QuarterAgg {
  return {
    ucGoals: a.ucGoals + b.ucGoals,
    oppGoals: a.oppGoals + b.oppGoals,
    ucShots: a.ucShots + b.ucShots,
    oppShots: a.oppShots + b.oppShots,
    ucPossessionSec: a.ucPossessionSec + b.ucPossessionSec,
    oppPossessionSec: a.oppPossessionSec + b.oppPossessionSec,
  };
}
