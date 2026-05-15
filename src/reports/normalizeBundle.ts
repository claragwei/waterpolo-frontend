import type { MatchReportBundle } from './aggregateMatchReport';

/** Coerce API bundle payload into report types. */
export function normalizeMatchReportBundle(raw: unknown): MatchReportBundle {
  const r = raw as MatchReportBundle;
  return {
    match: r.match,
    opponent_name: r.opponent_name ?? 'Opponent',
    player_stats: (r.player_stats ?? []).map((s) => ({
      player_id: Number(s.player_id),
      shots: Number(s.shots ?? 0),
      goals: Number(s.goals ?? 0),
      assists: Number(s.assists ?? 0),
      steals: Number(s.steals ?? 0),
      blocks: Number(s.blocks ?? 0),
      turnovers: Number(s.turnovers ?? 0),
    })),
    plays: (r.plays ?? []).map((p) => ({
      quarter: Number(p.quarter),
      game_time: Number(p.game_time),
      event_type: String(p.event_type ?? ''),
      player_id: p.player_id != null ? Number(p.player_id) : null,
      team_id: p.team_id != null ? Number(p.team_id) : null,
    })),
    referee_calls: (r.referee_calls ?? []).map((c) => ({
      quarter: Number(c.quarter),
      game_time: Number(c.game_time),
      call_type: String(c.call_type ?? ''),
    })),
    possessions: (r.possessions ?? []).map((p) => ({
      quarter: Number(p.quarter),
      start_time: Number(p.start_time),
      end_time: p.end_time != null ? Number(p.end_time) : null,
      team_id: Number(p.team_id),
    })),
  };
}
