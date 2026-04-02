interface Team {
  id: number;
  name: string;
  short_name: string;
  is_uc_davis: boolean;
  created_at?: string;
}

interface Match {
  id: number;
  uc_davis_team_id: number;
  opponent_team_id: number;
  match_date: string;
  location?: string;
  uc_davis_score: number;
  opponent_score: number;
  status: string;
  current_quarter: number;
  game_time?: string;
  referee_name?: string;
  created_at?: string;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const API_KEY  = import.meta.env.VITE_API_KEY  ?? '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // --- Players ---
  getPlayers: (params?: { team_id?: number; is_active?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.team_id !== undefined) qs.set('team_id', String(params.team_id));
    if (params?.is_active !== undefined) qs.set('is_active', String(params.is_active));
    const q = qs.toString();
    return apiFetch<{ id: number; name: string; jersey_number: number; position: string | null; is_active: boolean; team_id: number }[]>(
      `/api/players${q ? `?${q}` : ''}`,
    );
  },
  createPlayer: (body: { team_id: number; name: string; jersey_number: number; position?: string; is_active?: boolean }) =>
    apiFetch<{ id: number; name: string; jersey_number: number; position: string | null; is_active: boolean; team_id: number }>(
      '/api/players',
      { method: 'POST', body: JSON.stringify(body) },
    ),

  // --- Teams ---
  getTeams: (params?: { name?: string }) => {
    const qs = params?.name ? `?name=${encodeURIComponent(params.name)}` : '';
    return apiFetch<Team[]>(`/api/teams${qs}`);
  },
  createTeam: (body: { name: string; short_name: string; is_uc_davis: boolean }) =>
    apiFetch<Team>('/api/teams', { method: 'POST', body: JSON.stringify(body) }),

  // --- Matches ---
  createMatch: (body: {
    uc_davis_team_id: number;
    opponent_team_id: number;
    match_date: string;
    location: string;
  }) => apiFetch<Match>('/api/matches', { method: 'POST', body: JSON.stringify(body) }),

  updateMatch: (matchId: number, body: Partial<{
    status: string;
    uc_davis_score: number;
    opponent_score: number;
    current_quarter: number;
    game_time: string;
    referee_name: string;
  }>) => apiFetch<Match>(`/api/matches/${matchId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),

  // --- Stats ---
  // NOTE: backend upserts by (match, player) and increments by the delta values
  updateMatchStats: (matchId: number, playerId: number, delta: Record<string, number>) =>
    apiFetch(`/api/matches/${matchId}/stats`, {
      method: 'POST',
      body: JSON.stringify({ player_id: playerId, ...delta }),
    }),

  // Full-row overwrite used by handleSaveGame — backend should replace, not increment
  upsertMatchStats: (matchId: number, playerId: number, stats: Record<string, number>) =>
    apiFetch(`/api/matches/${matchId}/stats`, {
      method: 'PUT',                          // PUT = full overwrite, POST = delta increment
      body: JSON.stringify({ player_id: playerId, ...stats }),
    }),

  // --- Plays ---
  createPlay: (matchId: number, play: Record<string, unknown>) =>
    apiFetch(`/api/matches/${matchId}/plays`, {
      method: 'POST',
      body: JSON.stringify(play),
    }),

  // --- Referee calls ---
  createRefereeCall: (matchId: number, call: Record<string, unknown>) =>
    apiFetch(`/api/matches/${matchId}/referee-calls`, {
      method: 'POST',
      body: JSON.stringify(call),
    }),

  // --- Notes ---
  createNote: (matchId: number, note: Record<string, unknown>) =>
    apiFetch(`/api/matches/${matchId}/notes`, {
      method: 'POST',
      body: JSON.stringify(note),
    }),
};