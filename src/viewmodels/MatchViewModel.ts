import { supabase } from '../supabase/supabaseClient';
import { Match } from '../models/types';

export class MatchViewModel {
  async getMatch(id: number): Promise<Match | null> {
    const { data, error } = await supabase
      .from('match')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching match:', error);
      return null;
    }
    return data;
  }

  async createMatch(match: Omit<Match, 'id' | 'created_at' | 'updated_at'>): Promise<Match | null> {
    const { data, error } = await supabase
      .from('match')
      .insert([match])
      .select()
      .single();

    if (error) {
      console.error('Error creating match:', error);
      return null;
    }
    return data;
  }

  async updateScore(matchId: number, homeScore: number, awayScore: number): Promise<boolean> {
    const { error } = await supabase
      .from('match')
      .update({ home_score: homeScore, away_score: awayScore, updated_at: new Date().toISOString() })
      .eq('id', matchId);

    if (error) {
      console.error('Error updating score:', error);
      return false;
    }
    return true;
  }

  async updateStatus(matchId: number, status: 'Scheduled' | 'Live' | 'Final'): Promise<boolean> {
    const { error } = await supabase
      .from('match')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', matchId);

    if (error) {
      console.error('Error updating status:', error);
      return false;
    }
    return true;
  }
}
