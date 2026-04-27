import { createClient } from '@jsr/supabase__supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

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
    try {
      let query = supabase
        .from('playbyplay')
        .select('x_coordinate, y_coordinate')
        .or('event_type.ilike.shot,event_type.ilike.goal');

      if (matchId !== null) {
        query = query.eq('match_id', matchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        x: row.x_coordinate as number,
        y: row.y_coordinate as number,
      }));
    } catch (err) {
      console.error('HeatmapViewModel.fetchShotLocations error:', err);
      throw err;
    }
  }

  async fetchGoalLocations(matchId: number | null = null): Promise<HeatmapPoint[]> {
    try {
      let query = supabase
        .from('playbyplay')
        .select('x_coordinate, y_coordinate')
        .ilike('event_type', 'goal');

      if (matchId !== null) {
        query = query.eq('match_id', matchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        x: row.x_coordinate as number,
        y: row.y_coordinate as number,
      }));
    } catch (err) {
      console.error('HeatmapViewModel.fetchGoalLocations error:', err);
      throw err;
    }
  }

  async fetchMatches(): Promise<MatchOption[]> {
    try {
      const { data, error } = await supabase
        .from('match')
        .select('id, match_date, opponent_team_id, team:opponent_team_id(name)')
        .order('match_date', { ascending: false });

      if (error) throw error;

      return (data ?? []).map((row: any) => ({
        id: row.id as number,
        match_date: row.match_date as string,
        opponent_name: row.team?.name ?? `Opponent #${row.opponent_team_id}`,
      }));
    } catch (err) {
      console.error('HeatmapViewModel.fetchMatches error:', err);
      throw err;
    }
  }
}

export default new HeatmapViewModel();
