import { createClient } from '@jsr/supabase__supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export interface StartPossessionParams {
  matchId: number;
  teamId: number;
  quarter: number;
  startTimeSeconds: number;
  startReason: string | null;
}

export interface EndPossessionParams {
  possessionId: number;
  endTimeSeconds: number;
  durationSeconds: number;
  endReason: string | null;
}

class PossessionViewModel {
  async startPossession(params: StartPossessionParams): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('possession')
        .insert({
          match_id: params.matchId,
          team_id: params.teamId,
          quarter: params.quarter,
          start_time_seconds: params.startTimeSeconds,
          start_reason: params.startReason,
        })
        .select('id')
        .single();
      if (error) throw error;
      return (data as { id: number } | null)?.id ?? null;
    } catch (err) {
      console.error('PossessionViewModel.startPossession error:', err);
      return null;
    }
  }

  async endPossession(params: EndPossessionParams): Promise<void> {
    try {
      const { error } = await supabase
        .from('possession')
        .update({
          end_time_seconds: params.endTimeSeconds,
          duration_seconds: params.durationSeconds,
          end_reason: params.endReason,
        })
        .eq('id', params.possessionId);
      if (error) throw error;
    } catch (err) {
      console.error('PossessionViewModel.endPossession error:', err);
    }
  }
}

export default new PossessionViewModel();
