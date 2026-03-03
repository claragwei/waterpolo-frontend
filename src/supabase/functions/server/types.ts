// TypeScript interfaces for database models
// These match the Supabase database schema

export interface Team {
  id: string;
  name: string;
  coach_name: string | null;
  division: string | null;
  season: string | null;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  jersey_number: number;
  position: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  location: string | null;
  home_score: number;
  away_score: number;
  quarter_scores: {
    q1: [number, number];
    q2: [number, number];
    q3: [number, number];
    q4: [number, number];
  } | null;
  match_type: string;
  status: 'Scheduled' | 'Live' | 'Final';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMatchStats {
  id: string;
  team_id: string;
  match_id: string;
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
  created_at: string;
  updated_at: string;
}

export interface PlayerMatchStats {
  id: string;
  player_id: string;
  match_id: string;
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
  saves: number | null;
  goals_allowed: number | null;
  minutes_played: number;
  created_at: string;
  updated_at: string;
}

export interface Possession {
  id: string;
  match_id: string;
  team_id: string;
  quarter: number;
  start_time_seconds: number;
  end_time_seconds: number | null;
  duration_seconds: number;
  start_reason: string | null;
  end_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Play {
  id: string;
  name: string;
  description: string | null;
  play_type: string;
  formation: string | null;
  team_id: string | null;
  diagram_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchPlay {
  id: string;
  match_id: string;
  play_id: string;
  team_id: string;
  quarter: number;
  timestamp_seconds: number | null;
  is_successful: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Action {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string | null;
  possession_id: string | null;
  action_type: string;
  quarter: number;
  game_clock_seconds: number | null;
  timestamp: string;
  zone: string | null;
  coordinate_x: number | null;
  coordinate_y: number | null;
  result: string | null;
  assist_player_id: string | null;
  related_play_id: string | null;
  is_power_play: boolean;
  is_counter_attack: boolean;
  formation: '4-2' | '3-3' | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpponentProfile {
  id: string;
  team_id: string;
  avg_goals_per_game: number | null;
  avg_goals_allowed: number | null;
  formations_frequency: Record<string, number> | null;
  play_calls_frequency: Record<string, number> | null;
  shot_chart_hotspots: Record<string, number> | null;
  strengths: string | null;
  weaknesses: string | null;
  key_players: string[] | null;
  last_analysis_date: string | null;
  created_at: string;
  updated_at: string;
}

// Request/Response types for API endpoints
export interface CreateMatchRequest {
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  location?: string;
  match_type: string;
}

export interface SaveLiveStatsRequest {
  match_id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  quarter_scores: Match['quarter_scores'];
  home_team_stats: Omit<TeamMatchStats, 'id' | 'team_id' | 'match_id' | 'created_at' | 'updated_at'>;
  away_team_stats: Omit<TeamMatchStats, 'id' | 'team_id' | 'match_id' | 'created_at' | 'updated_at'>;
  home_player_stats: (Omit<PlayerMatchStats, 'id' | 'match_id' | 'created_at' | 'updated_at'> & { player_id: string })[];
  away_player_stats: (Omit<PlayerMatchStats, 'id' | 'match_id' | 'created_at' | 'updated_at'> & { player_id: string })[];
  actions: Omit<Action, 'id' | 'created_at' | 'updated_at'>[];
  possessions: Omit<Possession, 'id' | 'created_at' | 'updated_at'>[];
}

export interface PlayerWithStats extends Player {
  total_games: number;
  total_goals: number;
  total_shots: number;
  total_assists: number;
  total_steals: number;
  total_blocks: number;
  avg_goals: number;
  avg_shots: number;
  avg_assists: number;
  shot_percentage: number;
}
