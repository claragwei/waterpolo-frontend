// API client for making requests to the Supabase backend
import { projectId, publicAnonKey } from './utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-96cd1093`;

// Helper function to make API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.details || error.error || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// ============ TEAMS ============

export async function getTeams() {
  const data = await apiRequest<{ teams: any[] }>('/teams');
  return data.teams;
}

export async function getTeamById(id: string) {
  const data = await apiRequest<{ team: any }>(`/teams/${id}`);
  return data.team;
}

export async function getTeamByName(name: string) {
  const teams = await getTeams();
  return teams.find(t => t.name === name) || null;
}

export async function createTeam(teamData: {
  name: string;
  coach_name?: string;
  division?: string;
  season?: string;
}) {
  const data = await apiRequest<{ team: any }>('/teams', {
    method: 'POST',
    body: JSON.stringify(teamData),
  });
  return data.team;
}

// ============ PLAYERS ============

export async function getPlayersByTeam(teamId: string) {
  const data = await apiRequest<{ players: any[] }>(`/teams/${teamId}/players`);
  return data.players;
}

export async function getPlayersWithStats(teamId: string) {
  const data = await apiRequest<{ players: any[] }>(`/teams/${teamId}/players-with-stats`);
  return data.players;
}

export async function getPlayerById(id: string) {
  const data = await apiRequest<{ player: any }>(`/players/${id}`);
  return data.player;
}

export async function createPlayer(playerData: {
  team_id: string;
  first_name: string;
  last_name: string;
  jersey_number: number;
  position: string;
  is_active?: boolean;
}) {
  const data = await apiRequest<{ player: any }>('/players', {
    method: 'POST',
    body: JSON.stringify(playerData),
  });
  return data.player;
}

export async function updatePlayer(id: string, updates: Partial<{
  first_name: string;
  last_name: string;
  jersey_number: number;
  position: string;
  is_active: boolean;
}>) {
  const data = await apiRequest<{ player: any }>(`/players/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.player;
}

export async function getPlayerStats(playerId: string) {
  const data = await apiRequest<{ stats: any[] }>(`/players/${playerId}/stats`);
  return data.stats;
}

export async function getPlayerAverages(playerId: string, season?: string) {
  const endpoint = `/players/${playerId}/averages${season ? `?season=${season}` : ''}`;
  const data = await apiRequest<{ averages: any }>(endpoint);
  return data.averages;
}

// ============ MATCHES ============

export async function getMatches() {
  const data = await apiRequest<{ matches: any[] }>('/matches');
  return data.matches;
}

export async function getMatchById(id: string) {
  const data = await apiRequest<{
    match: any;
    teamStats: any[];
    playerStats: any[];
    actions: any[];
  }>(`/matches/${id}`);
  return data;
}

export async function createMatch(matchData: {
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  location?: string;
  match_type: string;
  status?: string;
}) {
  const data = await apiRequest<{ match: any }>('/matches', {
    method: 'POST',
    body: JSON.stringify(matchData),
  });
  return data.match;
}

export async function updateMatch(id: string, updates: Partial<{
  home_score: number;
  away_score: number;
  quarter_scores: any;
  status: string;
  notes: string;
}>) {
  const data = await apiRequest<{ match: any }>(`/matches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
  return data.match;
}

// ============ LIVE STATS ============

export interface SaveLiveStatsPayload {
  match_id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  quarter_scores: {
    q1: [number, number];
    q2: [number, number];
    q3: [number, number];
    q4: [number, number];
  };
  home_team_stats: {
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
  };
  away_team_stats: {
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
  };
  home_player_stats: Array<{
    player_id: string;
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
    saves?: number | null;
    goals_allowed?: number | null;
    minutes_played: number;
  }>;
  away_player_stats: Array<{
    player_id: string;
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
    saves?: number | null;
    goals_allowed?: number | null;
    minutes_played: number;
  }>;
  actions?: Array<{
    match_id: string;
    team_id: string;
    player_id?: string;
    action_type: string;
    quarter: number;
    game_clock_seconds: number;
    zone?: string;
    coordinate_x?: number;
    coordinate_y?: number;
    result?: string;
    formation?: '4-2' | '3-3';
    is_power_play?: boolean;
    is_counter_attack?: boolean;
  }>;
  possessions?: Array<{
    match_id: string;
    team_id: string;
    quarter: number;
    start_time_seconds: number;
    end_time_seconds: number;
    duration_seconds: number;
    start_reason?: string;
    end_reason?: string;
  }>;
}

export async function saveLiveStats(matchId: string, payload: SaveLiveStatsPayload) {
  const data = await apiRequest<{
    success: boolean;
    message: string;
    matchId: string;
  }>(`/matches/${matchId}/save-live-stats`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

// ============ ACTIONS (HEATMAPS) ============

export async function getMatchActions(matchId: string) {
  const data = await apiRequest<{ actions: any[] }>(`/matches/${matchId}/actions`);
  return data.actions;
}

// ============ UTILITY FUNCTIONS ============

// Get UC Davis team (assuming it exists)
export async function getUCDavisTeam() {
  const teams = await getTeams();
  return teams.find(t => t.name.includes('UC Davis') || t.name.includes('Aggies'));
}

// Get UC Davis players
export async function getUCDavisPlayers() {
  const ucDavis = await getUCDavisTeam();
  if (!ucDavis) {
    throw new Error('UC Davis team not found in database');
  }
  return getPlayersByTeam(ucDavis.id);
}

// Get UC Davis players with stats
export async function getUCDavisPlayersWithStats() {
  const ucDavis = await getUCDavisTeam();
  if (!ucDavis) {
    throw new Error('UC Davis team not found in database');
  }
  return getPlayersWithStats(ucDavis.id);
}
