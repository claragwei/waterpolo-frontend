import { supabase } from '../supabase/supabaseClient';
import { Possession } from '../models/types';

export class PossessionViewModel {
  async startPossession(possession: Omit<Possession, 'id' | 'created_at' | 'updated_at'>): Promise<Possession | null> {
    const { data, error } = await supabase
      .from('possession')
      .insert([possession])
      .select()
      .single();

    if (error) {
      console.error('Error starting possession:', error);
      return null;
    }
    return data;
  }

  async endPossession(
    possessionId: number,
    endTimeSeconds: number,
    endReason: string
  ): Promise<Possession | null> {
    // 1. Fetch current possession to calculate duration
    const { data: currentPossession, error: fetchError } = await supabase
      .from('possession')
      .select('*')
      .eq('id', possessionId)
      .single();

    if (fetchError || !currentPossession) {
      console.error('Error fetching possession:', fetchError);
      return null;
    }

    const durationSeconds = Math.abs(endTimeSeconds - currentPossession.start_time_seconds);

    // 2. Update
    const { data, error } = await supabase
      .from('possession')
      .update({
        end_time_seconds: endTimeSeconds,
        duration_seconds: durationSeconds,
        end_reason: endReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', possessionId)
      .select()
      .single();

    if (error) {
      console.error('Error ending possession:', error);
      return null;
    }
    return data;
  }
}
