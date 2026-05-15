import { api } from '../services/api';

export interface HeatmapPoint {
  x: number;
  y: number;
}

export interface MatchOption {
  id: number;
  match_date: string;
  opponent_name: string;
}

class HeatmapViewModel {
  async fetchShotLocations(matchId: number | null = null): Promise<HeatmapPoint[]> {
    const pts = await api.getHeatmapPoints({
      matchId: matchId === null ? undefined : matchId,
      kind: 'shots',
    });
    return pts.map((p) => ({ x: p.x, y: p.y }));
  }

  async fetchGoalLocations(matchId: number | null = null): Promise<HeatmapPoint[]> {
    const pts = await api.getHeatmapPoints({
      matchId: matchId === null ? undefined : matchId,
      kind: 'goals',
    });
    return pts.map((p) => ({ x: p.x, y: p.y }));
  }

  async fetchMatches(): Promise<MatchOption[]> {
    const [matches, teams] = await Promise.all([api.getMatches({ limit: 100 }), api.getTeams()]);
    const nameById = new Map(teams.map((t) => [t.id, t.name]));
    return matches.map((m) => ({
      id: m.id,
      match_date: m.match_date,
      opponent_name: nameById.get(m.opponent_team_id) ?? `Team #${m.opponent_team_id}`,
    }));
  }
}

export default new HeatmapViewModel();
