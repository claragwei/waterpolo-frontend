"""
API client for connecting React frontend to Python backend
Use this in your React app to replace Supabase KV store calls
"""

// api.ts - TypeScript API client for your React app

const API_BASE_URL = 'http://localhost:8000/api';

// Types matching Python schemas
export interface Team {
  id: number;
  name: string;
  short_name?: string;
  is_uc_davis: boolean;
  created_at: string;
}

export interface Player {
  id: number;
  team_id: number;
  name: string;
  jersey_number: number;
  position?: string;
  is_active: boolean;
  total_goals: number;
  total_assists: number;
  total_shots: number;
  total_steals: number;
  total_blocks: number;
  total_turnovers: number;
  total_exclusions: number;
  total_penalties: number;
  created_at: string;
  team?: Team;
}

export interface Match {
  id: number;
  uc_davis_team_id: number;
  opponent_team_id: number;
  match_date: string;
  location?: string;
  uc_davis_score: number;
  opponent_score: number;
  status: string;
  current_quarter: number;
  game_time: number;
  referee_name?: string;
  created_at: string;
  uc_davis_team?: Team;
  opponent_team?: Team;
}

export interface PlayerMatchStats {
  id: number;
  match_id: number;
  player_id: number;
  shots: number;
  goals: number;
  assists: number;
  steals: number;
  blocks: number;
  turnovers: number;
  penalties: number;
  exclusions: number;
  rebounds: number;
  tipped_passes: number;
  sprints: number;
  hustle: number;
  draws: number;
  time_in_pool: number;
  player?: Player;
}

export interface PlayByPlay {
  id: number;
  match_id: number;
  player_id?: number;
  quarter: number;
  game_time: number;
  event_type: string;
  description?: string;
  x_coordinate?: number;
  y_coordinate?: number;
  formation?: string;
  created_at: string;
}

export interface PlayerAverages {
  player_id: number;
  player_name: string;
  jersey_number: number;
  games_played: number;
  avg_goals: number;
  avg_assists: number;
  avg_shots: number;
  avg_steals: number;
  avg_blocks: number;
  avg_turnovers: number;
  shot_accuracy: number;
}

export interface TeamStats {
  team_id: number;
  team_name: string;
  total_goals: number;
  total_shots: number;
  total_assists: number;
  total_steals: number;
  shot_accuracy: number;
  wins: number;
  losses: number;
  ties: number;
}

// API Client
class WaterPoloAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API request failed');
    }

    return response.json();
  }

  // Teams
  async getTeams(): Promise<Team[]> {
    return this.request<Team[]>('/teams');
  }

  async getTeam(id: number): Promise<Team> {
    return this.request<Team>(`/teams/${id}`);
  }

  async createTeam(data: { name: string; short_name?: string; is_uc_davis?: boolean }): Promise<Team> {
    return this.request<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Players
  async getPlayers(filters?: { team_id?: number; is_active?: boolean; search?: string }): Promise<Player[]> {
    const params = new URLSearchParams();
    if (filters?.team_id) params.append('team_id', filters.team_id.toString());
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Player[]>(`/players${query}`);
  }

  async getPlayer(id: number): Promise<Player> {
    return this.request<Player>(`/players/${id}`);
  }

  async createPlayer(data: {
    team_id: number;
    name: string;
    jersey_number: number;
    position?: string;
    is_active?: boolean;
  }): Promise<Player> {
    return this.request<Player>('/players', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlayer(id: number, data: Partial<Player>): Promise<Player> {
    return this.request<Player>(`/players/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePlayer(id: number): Promise<void> {
    await this.request<void>(`/players/${id}`, { method: 'DELETE' });
  }

  async getPlayerAverages(id: number): Promise<PlayerAverages> {
    return this.request<PlayerAverages>(`/players/${id}/averages`);
  }

  // Matches
  async getMatches(status?: string): Promise<Match[]> {
    const query = status ? `?status=${status}` : '';
    return this.request<Match[]>(`/matches${query}`);
  }

  async getMatch(id: number): Promise<Match> {
    return this.request<Match>(`/matches/${id}`);
  }

  async createMatch(data: {
    uc_davis_team_id: number;
    opponent_team_id: number;
    match_date: string;
    location?: string;
    referee_name?: string;
  }): Promise<Match> {
    return this.request<Match>('/matches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMatch(id: number, data: Partial<Match>): Promise<Match> {
    return this.request<Match>(`/matches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Match Stats
  async getMatchStats(matchId: number): Promise<PlayerMatchStats[]> {
    return this.request<PlayerMatchStats[]>(`/matches/${matchId}/stats`);
  }

  async updateMatchStats(matchId: number, data: Omit<PlayerMatchStats, 'id' | 'created_at'>): Promise<PlayerMatchStats> {
    return this.request<PlayerMatchStats>(`/matches/${matchId}/stats`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Play by Play
  async getMatchPlays(matchId: number): Promise<PlayByPlay[]> {
    return this.request<PlayByPlay[]>(`/matches/${matchId}/plays`);
  }

  async createPlay(matchId: number, data: Omit<PlayByPlay, 'id' | 'match_id' | 'created_at'>): Promise<PlayByPlay> {
    return this.request<PlayByPlay>(`/matches/${matchId}/plays`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Statistics
  async getTeamStats(teamId: number): Promise<TeamStats> {
    return this.request<TeamStats>(`/teams/${teamId}/stats`);
  }
}

// Export singleton instance
export const api = new WaterPoloAPI();

// React Hook examples
export function usePlayerAverages(playerId: number) {
  const [averages, setAverages] = React.useState<PlayerAverages | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    api.getPlayerAverages(playerId)
      .then(setAverages)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [playerId]);

  return { averages, loading, error };
}

export function usePlayers(filters?: { team_id?: number; is_active?: boolean; search?: string }) {
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    api.getPlayers(filters)
      .then(setPlayers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [filters?.team_id, filters?.is_active, filters?.search]);

  return { players, loading, error };
}

// Usage Example in React Component:
/*
import { api, usePlayers, usePlayerAverages } from './api';

function PlayerList() {
  const { players, loading, error } = usePlayers({ team_id: 1, is_active: true });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {players.map(player => (
        <div key={player.id}>
          #{player.jersey_number} {player.name} - {player.total_goals} goals
        </div>
      ))}
    </div>
  );
}

function PlayerStats({ playerId }: { playerId: number }) {
  const { averages, loading, error } = usePlayerAverages(playerId);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>{averages.player_name} - #{averages.jersey_number}</h2>
      <p>Games Played: {averages.games_played}</p>
      <p>Avg Goals: {averages.avg_goals.toFixed(2)}</p>
      <p>Avg Assists: {averages.avg_assists.toFixed(2)}</p>
      <p>Shot Accuracy: {averages.shot_accuracy}%</p>
    </div>
  );
}

// Create a new match
async function createNewMatch() {
  const match = await api.createMatch({
    uc_davis_team_id: 1,
    opponent_team_id: 2,
    match_date: new Date().toISOString(),
    location: 'UC Davis Aquatic Center',
    referee_name: 'John Smith'
  });
  console.log('Match created:', match);
}

// Update player stats during live game
async function updateLiveStats(matchId: number, playerId: number, goals: number, assists: number) {
  const stats = await api.updateMatchStats(matchId, {
    player_id: playerId,
    goals,
    assists,
    shots: goals + 3, // example
    steals: 2,
    // ... other stats
  });
  console.log('Stats updated:', stats);
}

// Search players by name
async function searchPlayers(query: string) {
  const players = await api.getPlayers({ search: query });
  return players;
}

// Get UC Davis team stats
async function getTeamStats() {
  const stats = await api.getTeamStats(1); // UC Davis team ID
  console.log(`Record: ${stats.wins}-${stats.losses}-${stats.ties}`);
  console.log(`Total Goals: ${stats.total_goals}`);
  console.log(`Shot Accuracy: ${stats.shot_accuracy}%`);
}
*/
