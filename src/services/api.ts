import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:8000/api';

export interface Player {
  id: number;
  name: string;
  jersey_number: number;
  team_id: number;
  is_active: boolean;
  total_goals: number;
  total_assists: number;
  total_shots: number;
  // ... other fields
}

// API client
export const api = {
  // Players
  async getPlayers(teamId?: number) {
    const url = teamId 
      ? `${API_BASE}/players?team_id=${teamId}`
      : `${API_BASE}/players`;
    const res = await fetch(url);
    return res.json();
  },

  async getPlayer(id: number) {
    const res = await fetch(`${API_BASE}/players/${id}`);
    return res.json();
  },

  async updatePlayer(id: number, data: Partial<Player>) {
    const res = await fetch(`${API_BASE}/players/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Matches
  async createMatch(data: any) {
    const res = await fetch(`${API_BASE}/matches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateMatchStats(matchId: number, playerId: number, stats: any) {
    const res = await fetch(`${API_BASE}/matches/${matchId}/stats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId, ...stats })
    });
    return res.json();
  },

  // Statistics
  async getPlayerAverages(playerId: number) {
    const res = await fetch(`${API_BASE}/players/${playerId}/averages`);
    return res.json();
  },

  async getTeamStats(teamId: number) {
    const res = await fetch(`${API_BASE}/teams/${teamId}/stats`);
    return res.json();
  }
};

// React hooks
export function usePlayers(teamId?: number) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPlayers(teamId)
      .then(setPlayers)
      .finally(() => setLoading(false));
  }, [teamId]);

  return { players, loading };
}

export function usePlayerStats(playerId: number) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (playerId) {
      api.getPlayerAverages(playerId)
        .then(setStats)
        .finally(() => setLoading(false));
    }
  }, [playerId]);

  return { stats, loading };
}
