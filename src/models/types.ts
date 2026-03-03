export interface Team {
  id?: number;
  name: string;
  coach_name?: string;
  division?: string;
  season?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Player {
  id?: number;
  team_id: number;
  first_name: string;
  last_name: string;
  jersey_number: number;
  position: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Match {
  id?: number;
  home_team_id: number;
  away_team_id: number;
  match_date: string;
  location?: string;
  home_score: number;
  away_score: number;
  quarter_scores?: Record<string, [number, number]>;
  match_type: string;
  status: 'Scheduled' | 'Live' | 'Final';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMatchStats {
  id?: number;
  team_id: number;
  match_id: number;
  fco: number;
  fcd: number;
  cao: number;
  cad: number;
  ag: number;
  agd: number;
  six_on_five_opportunities: number;
  five_on_six_opportunities: number;
  seven_on_six_opportunities: number;
  six_on_seven_opportunities: number;
  total_possession_time_seconds: number;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerMatchStats {
  id?: number;
  player_id: number;
  match_id: number;
  shots_attempted: number;
  goals: number;
  assists: number;
  turnovers: number;
  steals: number;
  blocks: number;
  rebounds: number;
  tipped_passes: number;
  sprints_won: number;
  sprints_attempted: number;
  hustles: number;
  fouls_committed: number;
  exclusions_committed: number;
  exclusions_drawn: number;
  penalty_fouls_committed: number;
  power_play_goals: number;
  penalty_shots_made: number;
  penalty_shots_attempted: number;
  saves?: number;
  goals_allowed?: number;
  minutes_played: number;
  created_at?: string;
  updated_at?: string;
}

export const calculateShotPercentage = (stats: PlayerMatchStats): number => {
  if (stats.shots_attempted === 0) return 0;
  return (stats.goals / stats.shots_attempted) * 100;
};

export interface Possession {
  id?: number;
  match_id: number;
  team_id: number;
  quarter: number;
  start_time_seconds: number;
  end_time_seconds?: number;
  duration_seconds: number;
  start_reason?: string;
  end_reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Action {
  id?: number;
  match_id: number;
  team_id: number;
  player_id?: number;
  possession_id?: number;
  action_type: string;
  quarter: number;
  game_clock_seconds?: number;
  timestamp?: string;
  zone?: string;
  coordinate_x?: number;
  coordinate_y?: number;
  result?: string;
  assist_player_id?: number;
  is_power_play: boolean;
  is_counter_attack: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
