// Database helper functions for Supabase
import { createClient } from 'jsr:@supabase/supabase-js@2';
import type {
  Team,
  Player,
  Match,
  TeamMatchStats,
  PlayerMatchStats,
  Action,
  Possession,
  PlayerWithStats
} from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create Supabase client with service role (server-side only)
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============ TEAMS ============

export async function getTeams() {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data as Team[];
}

export async function getTeamById(id: string) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Team;
}

export async function getTeamByName(name: string) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('name', name)
    .single();
  
  if (error) throw error;
  return data as Team | null;
}

export async function createTeam(team: Omit<Team, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('teams')
    .insert(team)
    .select()
    .single();
  
  if (error) throw error;
  return data as Team;
}

// ============ PLAYERS ============

export async function getPlayersByTeam(teamId: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('jersey_number');
  
  if (error) throw error;
  return data as Player[];
}

export async function getPlayerById(id: string) {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Player;
}

export async function createPlayer(player: Omit<Player, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('players')
    .insert(player)
    .select()
    .single();
  
  if (error) throw error;
  return data as Player;
}

export async function updatePlayer(id: string, updates: Partial<Player>) {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Player;
}

// ============ MATCHES ============

export async function getMatches() {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(id, name),
      away_team:teams!matches_away_team_id_fkey(id, name)
    `)
    .order('match_date', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getMatchById(id: string) {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      home_team:teams!matches_home_team_id_fkey(*),
      away_team:teams!matches_away_team_id_fkey(*)
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createMatch(match: Omit<Match, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('matches')
    .insert(match)
    .select()
    .single();
  
  if (error) throw error;
  return data as Match;
}

export async function updateMatch(id: string, updates: Partial<Match>) {
  const { data, error } = await supabase
    .from('matches')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Match;
}

// ============ TEAM MATCH STATS ============

export async function getTeamMatchStats(matchId: string) {
  const { data, error } = await supabase
    .from('team_match_stats')
    .select('*, team:teams(*)')
    .eq('match_id', matchId);
  
  if (error) throw error;
  return data;
}

export async function createTeamMatchStats(stats: Omit<TeamMatchStats, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('team_match_stats')
    .insert(stats)
    .select()
    .single();
  
  if (error) throw error;
  return data as TeamMatchStats;
}

export async function upsertTeamMatchStats(stats: Omit<TeamMatchStats, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('team_match_stats')
    .upsert(stats, { onConflict: 'team_id,match_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data as TeamMatchStats;
}

// ============ PLAYER MATCH STATS ============

export async function getPlayerMatchStats(matchId: string) {
  const { data, error } = await supabase
    .from('player_match_stats')
    .select(`
      *,
      player:players(*)
    `)
    .eq('match_id', matchId);
  
  if (error) throw error;
  return data;
}

export async function getPlayerStatsByPlayer(playerId: string) {
  const { data, error } = await supabase
    .from('player_match_stats')
    .select('*')
    .eq('player_id', playerId);
  
  if (error) throw error;
  return data as PlayerMatchStats[];
}

export async function createPlayerMatchStats(stats: Omit<PlayerMatchStats, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('player_match_stats')
    .insert(stats)
    .select()
    .single();
  
  if (error) throw error;
  return data as PlayerMatchStats;
}

export async function upsertPlayerMatchStats(stats: Omit<PlayerMatchStats, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('player_match_stats')
    .upsert(stats, { onConflict: 'player_id,match_id' })
    .select()
    .single();
  
  if (error) throw error;
  return data as PlayerMatchStats;
}

// Bulk upsert for multiple player stats
export async function bulkUpsertPlayerMatchStats(statsArray: Omit<PlayerMatchStats, 'id' | 'created_at' | 'updated_at'>[]) {
  const { data, error } = await supabase
    .from('player_match_stats')
    .upsert(statsArray, { onConflict: 'player_id,match_id' })
    .select();
  
  if (error) throw error;
  return data as PlayerMatchStats[];
}

// ============ ACTIONS (for heatmaps) ============

export async function getActionsByMatch(matchId: string) {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .eq('match_id', matchId)
    .order('quarter', { ascending: true })
    .order('game_clock_seconds', { ascending: false });
  
  if (error) throw error;
  return data as Action[];
}

export async function createAction(action: Omit<Action, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('actions')
    .insert(action)
    .select()
    .single();
  
  if (error) throw error;
  return data as Action;
}

export async function bulkCreateActions(actions: Omit<Action, 'id' | 'created_at' | 'updated_at'>[]) {
  const { data, error } = await supabase
    .from('actions')
    .insert(actions)
    .select();
  
  if (error) throw error;
  return data as Action[];
}

// ============ POSSESSIONS ============

export async function getPossessionsByMatch(matchId: string) {
  const { data, error } = await supabase
    .from('possessions')
    .select('*')
    .eq('match_id', matchId)
    .order('quarter', { ascending: true })
    .order('start_time_seconds', { ascending: false });
  
  if (error) throw error;
  return data as Possession[];
}

export async function createPossession(possession: Omit<Possession, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('possessions')
    .insert(possession)
    .select()
    .single();
  
  if (error) throw error;
  return data as Possession;
}

export async function bulkCreatePossessions(possessions: Omit<Possession, 'id' | 'created_at' | 'updated_at'>[]) {
  const { data, error } = await supabase
    .from('possessions')
    .insert(possessions)
    .select();
  
  if (error) throw error;
  return data as Possession[];
}

// ============ AGGREGATE QUERIES ============

// Get player season averages
export async function getPlayerSeasonAverages(playerId: string, season?: string) {
  let query = supabase
    .from('player_match_stats')
    .select(`
      *,
      match:matches(match_date, season:home_team:teams(season))
    `)
    .eq('player_id', playerId);

  const { data, error } = await query;
  
  if (error) throw error;
  
  const stats = data as PlayerMatchStats[];
  if (stats.length === 0) {
    return null;
  }

  const totalGames = stats.length;
  const totalGoals = stats.reduce((sum, s) => sum + s.goals, 0);
  const totalShots = stats.reduce((sum, s) => sum + s.shots_attempted, 0);
  const totalAssists = stats.reduce((sum, s) => sum + s.assists, 0);
  const totalSteals = stats.reduce((sum, s) => sum + s.steals, 0);
  const totalBlocks = stats.reduce((sum, s) => sum + s.blocks, 0);

  return {
    games_played: totalGames,
    avg_goals: totalGoals / totalGames,
    avg_shots: totalShots / totalGames,
    avg_assists: totalAssists / totalGames,
    avg_steals: totalSteals / totalGames,
    avg_blocks: totalBlocks / totalGames,
    shot_percentage: totalShots > 0 ? (totalGoals / totalShots) * 100 : 0,
  };
}

// Get all players with aggregated stats for a team
export async function getPlayersWithStats(teamId: string): Promise<PlayerWithStats[]> {
  const { data: players, error: playersError } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId);

  if (playersError) throw playersError;

  const playersWithStats = await Promise.all(
    players.map(async (player) => {
      const { data: stats, error: statsError } = await supabase
        .from('player_match_stats')
        .select('*')
        .eq('player_id', player.id);

      if (statsError) throw statsError;

      const totalGames = stats.length;
      const totalGoals = stats.reduce((sum, s) => sum + s.goals, 0);
      const totalShots = stats.reduce((sum, s) => sum + s.shots_attempted, 0);
      const totalAssists = stats.reduce((sum, s) => sum + s.assists, 0);
      const totalSteals = stats.reduce((sum, s) => sum + s.steals, 0);
      const totalBlocks = stats.reduce((sum, s) => sum + s.blocks, 0);

      return {
        ...player,
        total_games: totalGames,
        total_goals: totalGoals,
        total_shots: totalShots,
        total_assists: totalAssists,
        total_steals: totalSteals,
        total_blocks: totalBlocks,
        avg_goals: totalGames > 0 ? totalGoals / totalGames : 0,
        avg_shots: totalGames > 0 ? totalShots / totalGames : 0,
        avg_assists: totalGames > 0 ? totalAssists / totalGames : 0,
        shot_percentage: totalShots > 0 ? (totalGoals / totalShots) * 100 : 0,
      } as PlayerWithStats;
    })
  );

  return playersWithStats;
}
