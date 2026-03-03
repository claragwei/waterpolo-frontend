import { supabase } from '../supabase/supabaseClient';
import { PlayerMatchStats } from '../models/types';

export class PlayerStatsViewModel {
  async getPlayerMatchStats(playerId: number, matchId: number): Promise<PlayerMatchStats | null> {
    const { data, error } = await supabase
      .from('playermatchstats')
      .select('*')
      .eq('player_id', playerId)
      .eq('match_id', matchId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching player match stats:', error);
      return null;
    }
    return data;
  }

  async incrementStat(
    playerId: number,
    matchId: number,
    field: keyof PlayerMatchStats,
    amount: number = 1
  ): Promise<PlayerMatchStats | null> {
    // 1. Fetch current stats
    const currentStats = await this.getPlayerMatchStats(playerId, matchId);

    // 2. Prepare upsert data
    const newStats: Partial<PlayerMatchStats> = {
      player_id: playerId,
      match_id: matchId,
      [field]: ((currentStats?.[field] as number) || 0) + amount,
      updated_at: new Date().toISOString()
    };

    // 3. Upsert
    const { data, error } = await supabase
      .from('playermatchstats')
      .upsert(newStats, { onConflict: 'player_id,match_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting player match stats:', error);
      return null;
    }
    return data;
  }
}
