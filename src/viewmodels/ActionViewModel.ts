import { supabase } from '../supabase/supabaseClient';
import { Action } from '../models/types';

export class ActionViewModel {
  async logAction(action: Omit<Action, 'id' | 'created_at' | 'updated_at' | 'timestamp'>): Promise<Action | null> {
    const { data, error } = await supabase
      .from('action')
      .insert([{
        ...action,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error logging action:', error);
      throw error;
    }
    return data;
  }
}
