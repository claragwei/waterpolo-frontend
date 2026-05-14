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

interface MatchVideoSync {
  id: number;
  match_id: number;
  quarter: number;
  video_url: string;
  video_offset_sec: number;
  created_at?: string;
  updated_at?: string;
}

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const API_KEY  = import.meta.env.VITE_API_KEY  ?? '';

let getAccessToken: () => string | null = () => null;

/** Called from AuthProvider so API writes work with Supabase JWT when configured on the backend. */
export function setApiAuthTokenGetter(fn: () => string | null) {
  getAccessToken = fn;
}

const REQUEST_TIMEOUT_MS = 25_000;

function apiUnreachableHint(): string {
  return (
    `Could not reach the API at ${BASE_URL}. ` +
    `Start the backend (e.g. \`cd backend && uvicorn main:app --reload --port 8000\`) ` +
    `and set VITE_API_URL in the frontend .env if it is not on port 8000.`
  );
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
    ...((options?.headers as Record<string, string> | undefined) ?? {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s (${BASE_URL}${path}).`);
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === 'Failed to fetch' || e instanceof TypeError) {
      throw new Error(`${msg}. ${apiUnreachableHint()}`);
    }
    throw e;
  } finally {
    window.clearTimeout(timer);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = (err as { detail?: string }).detail;
    if (res.status === 403) {
      throw new Error(
        typeof detail === 'string'
          ? detail
          : `API returned 403. Check that VITE_API_KEY matches the backend API_KEY.`,
      );
    }
    throw new Error(typeof detail === 'string' ? detail : `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  getHealth: () => apiFetch<{ status: string }>('/api/health'),

  // --- Players ---
  getPlayers: (params?: { team_id?: number; is_active?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.team_id !== undefined) qs.set('team_id', String(params.team_id));
    if (params?.is_active !== undefined) qs.set('is_active', String(params.is_active));
    const q = qs.toString();
    return apiFetch<{ id: number; name: string; jersey_number: number; position: string | null; is_active: boolean; team_id: number; photo_url?: string | null }[]>(
      `/api/players${q ? `?${q}` : ''}`,
    );
  },

  getPlayersBatchSummary: (teamId: number = 1) =>
    apiFetch<
      {
        id: number;
        name: string;
        jersey_number: number;
        position: string | null;
        is_active: boolean;
        team_id: number;
        photo_url?: string | null;
        games_played: number;
        total_goals: number;
        total_shots: number;
        total_assists: number;
        total_steals: number;
        total_blocks: number;
        shot_percentage: number;
      }[]
    >(`/api/players/batch-summary?team_id=${teamId}`),
  createPlayer: (body: {
    team_id: number;
    name: string;
    jersey_number: number;
    position?: string;
    is_active?: boolean;
    photo_url?: string | null;
  }) =>
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
  getMatches: (params?: { status?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.limit != null) qs.set('limit', String(params.limit));
    const q = qs.toString();
    return apiFetch<Match[]>(`/api/matches${q ? `?${q}` : ''}`);
  },

  getMatch: (matchId: number) => apiFetch<Match>(`/api/matches/${matchId}`),

  getMatchPlays: (matchId: number) =>
    apiFetch<
      {
        id: number;
        match_id: number;
        quarter: number;
        game_time: number;
        event_type: string;
        player_id: number | null;
        team_id: number | null;
        x_coordinate: number | null;
        y_coordinate: number | null;
        stat_name: string | null;
        value: number | null;
      }[]
    >(`/api/matches/${matchId}/plays`),

  getMatchStats: (matchId: number) =>
    apiFetch<
      {
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
      }[]
    >(`/api/matches/${matchId}/stats`),

  getMatchRefereeCalls: (matchId: number) =>
    apiFetch<
      { id: number; quarter: number; game_time: number; call_type: string; player_name: string | null }[]
    >(`/api/matches/${matchId}/referee-calls`),

  getHeatmapPoints: (params?: { matchId?: number | null; kind?: 'shots' | 'goals' }) => {
    const qs = new URLSearchParams();
    if (params?.matchId != null) qs.set('match_id', String(params.matchId));
    if (params?.kind) qs.set('kind', params.kind);
    const q = qs.toString();
    return apiFetch<{ x: number; y: number }[]>(`/api/heatmap/points${q ? `?${q}` : ''}`);
  },

  getMatchReportBundle: (matchId: number) =>
    apiFetch<{
      match: Match;
      opponent_name: string;
      player_stats: Record<string, unknown>[];
      plays: Record<string, unknown>[];
      referee_calls: Record<string, unknown>[];
      possessions: Record<string, unknown>[];
    }>(`/api/reports/match/${matchId}/bundle`),

  getSeasonSummary: (teamId: number = 1) =>
    apiFetch<{
      team: Team;
      active_players: Array<Record<string, unknown>>;
      completed_home_matches: number;
    }>(`/api/reports/season-summary?team_id=${teamId}`),

  getPlayerAverages: (playerId: number) =>
    apiFetch<{
      player_id: number;
      games_played: number;
      avg_goals: number;
      avg_assists: number;
      avg_shots: number;
      avg_steals: number;
      avg_blocks: number;
      shot_percentage: number;
    }>(`/api/players/${playerId}/averages`),

  getPlayerMatchHistory: (playerId: number, limit?: number) =>
    apiFetch<
      {
        match_id: number;
        match_date: string;
        opponent_name: string;
        goals: number;
        shots: number;
        assists: number;
        steals: number;
        blocks: number;
        turnovers: number;
      }[]
    >(`/api/players/${playerId}/match-history${limit != null ? `?limit=${limit}` : ''}`),

  createPossession: (
    matchId: number,
    body: { team_id: number; quarter: number; start_time: number; outcome?: string | null; is_power_play?: boolean },
  ) =>
    apiFetch<{ id: number; match_id: number; team_id: number; quarter: number; start_time: number; end_time: number | null; outcome: string | null; is_power_play: boolean }>(
      `/api/matches/${matchId}/possessions`,
      { method: 'POST', body: JSON.stringify({ ...body, is_power_play: body.is_power_play ?? false }) },
    ),

  patchPossession: (
    matchId: number,
    possessionId: number,
    body: { end_time?: number; outcome?: string | null },
  ) =>
    apiFetch<{ id: number }>(`/api/matches/${matchId}/possessions/${possessionId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  createMatch: (body: {
    uc_davis_team_id: number;
    opponent_team_id: number;
    match_date: string;
    location: string;
    status?: string;
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

  // --- Match video sync ---
  getMatchVideoSync: (matchId: number) =>
    apiFetch<MatchVideoSync[]>(`/api/matches/${matchId}/video-sync`),

  upsertMatchVideoSync: (
    matchId: number,
    body: { quarter: number; video_url: string; video_offset_sec: number },
  ) =>
    apiFetch<MatchVideoSync>(`/api/matches/${matchId}/video-sync`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};