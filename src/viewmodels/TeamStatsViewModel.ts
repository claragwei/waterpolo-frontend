import { supabase } from '../supabase/supabaseClient';
import { TeamMatchStats } from '../models/types';

export class TeamStatsViewModel {
  async getTeamMatchStats(teamId: number, matchId: number): Promise<TeamMatchStats | null> {
    const { data, error } = await supabase
      .from('teammatchstats')
      .select('*')
      .eq('team_id', teamId)
      .eq('match_id', matchId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching team match stats:', error);
      return null;
    }
    return data;
  }

  async incrementStat(
    teamId: number,
    matchId: number,
    field: keyof TeamMatchStats,
    amount: number = 1
  ): Promise<TeamMatchStats | null> {
    const currentStats = await this.getTeamMatchStats(teamId, matchId);

    const newStats: Partial<TeamMatchStats> = {
      team_id: teamId,
      match_id: matchId,
      [field]: ((currentStats?.[field] as number) || 0) + amount,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('teammatchstats')
      .upsert(newStats, { onConflict: 'team_id,match_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting team match stats:', error);
      return null;
    }
    return data;
  }

  async updatePossessionTime(teamId: number, matchId: number, totalSeconds: number): Promise<boolean> {
    const { error } = await supabase
      .from('teammatchstats')
      .upsert({
        team_id: teamId,
        match_id: matchId,
        total_possession_time_seconds: totalSeconds,
        updated_at: new Date().toISOString()
      }, { onConflict: 'team_id,match_id' });

    if (error) {
      console.error('Error updating possession time:', error);
      return false;
    }
    return true;
  }
}
