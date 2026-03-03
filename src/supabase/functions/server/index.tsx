import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as db from "./db.ts";
import type { SaveLiveStatsRequest } from "./types.ts";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-96cd1093/health", (c) => {
  return c.json({ status: "ok" });
});

// ============ TEAMS ============

app.get("/make-server-96cd1093/teams", async (c) => {
  try {
    const teams = await db.getTeams();
    return c.json({ teams });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return c.json({ error: 'Failed to fetch teams', details: error.message }, 500);
  }
});

app.get("/make-server-96cd1093/teams/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const team = await db.getTeamById(id);
    return c.json({ team });
  } catch (error) {
    console.error('Error fetching team:', error);
    return c.json({ error: 'Failed to fetch team', details: error.message }, 500);
  }
});

app.post("/make-server-96cd1093/teams", async (c) => {
  try {
    const body = await c.req.json();
    const team = await db.createTeam(body);
    return c.json({ team }, 201);
  } catch (error) {
    console.error('Error creating team:', error);
    return c.json({ error: 'Failed to create team', details: error.message }, 500);
  }
});

// ============ PLAYERS ============

app.get("/make-server-96cd1093/teams/:teamId/players", async (c) => {
  try {
    const teamId = c.req.param('teamId');
    const players = await db.getPlayersByTeam(teamId);
    return c.json({ players });
  } catch (error) {
    console.error('Error fetching players:', error);
    return c.json({ error: 'Failed to fetch players', details: error.message }, 500);
  }
});

app.get("/make-server-96cd1093/players/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const player = await db.getPlayerById(id);
    return c.json({ player });
  } catch (error) {
    console.error('Error fetching player:', error);
    return c.json({ error: 'Failed to fetch player', details: error.message }, 500);
  }
});

app.post("/make-server-96cd1093/players", async (c) => {
  try {
    const body = await c.req.json();
    const player = await db.createPlayer(body);
    return c.json({ player }, 201);
  } catch (error) {
    console.error('Error creating player:', error);
    return c.json({ error: 'Failed to create player', details: error.message }, 500);
  }
});

app.put("/make-server-96cd1093/players/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const player = await db.updatePlayer(id, body);
    return c.json({ player });
  } catch (error) {
    console.error('Error updating player:', error);
    return c.json({ error: 'Failed to update player', details: error.message }, 500);
  }
});

// Get players with aggregated stats
app.get("/make-server-96cd1093/teams/:teamId/players-with-stats", async (c) => {
  try {
    const teamId = c.req.param('teamId');
    const players = await db.getPlayersWithStats(teamId);
    return c.json({ players });
  } catch (error) {
    console.error('Error fetching players with stats:', error);
    return c.json({ error: 'Failed to fetch players with stats', details: error.message }, 500);
  }
});

// ============ MATCHES ============

app.get("/make-server-96cd1093/matches", async (c) => {
  try {
    const matches = await db.getMatches();
    return c.json({ matches });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return c.json({ error: 'Failed to fetch matches', details: error.message }, 500);
  }
});

app.get("/make-server-96cd1093/matches/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const match = await db.getMatchById(id);
    
    // Also fetch related stats
    const teamStats = await db.getTeamMatchStats(id);
    const playerStats = await db.getPlayerMatchStats(id);
    const actions = await db.getActionsByMatch(id);
    
    return c.json({ 
      match, 
      teamStats,
      playerStats,
      actions 
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    return c.json({ error: 'Failed to fetch match', details: error.message }, 500);
  }
});

app.post("/make-server-96cd1093/matches", async (c) => {
  try {
    const body = await c.req.json();
    const match = await db.createMatch(body);
    return c.json({ match }, 201);
  } catch (error) {
    console.error('Error creating match:', error);
    return c.json({ error: 'Failed to create match', details: error.message }, 500);
  }
});

app.put("/make-server-96cd1093/matches/:id", async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const match = await db.updateMatch(id, body);
    return c.json({ match });
  } catch (error) {
    console.error('Error updating match:', error);
    return c.json({ error: 'Failed to update match', details: error.message }, 500);
  }
});

// ============ LIVE STATS SAVE ============

// Comprehensive endpoint to save all live stats data at once
app.post("/make-server-96cd1093/matches/:id/save-live-stats", async (c) => {
  try {
    const matchId = c.req.param('id');
    const body = await c.req.json() as SaveLiveStatsRequest;
    
    console.log(`Saving live stats for match ${matchId}...`);

    // Update match scores and status
    await db.updateMatch(matchId, {
      home_score: body.home_score,
      away_score: body.away_score,
      quarter_scores: body.quarter_scores,
      status: 'Final',
    });
    console.log('  ✓ Updated match scores');

    // Save team stats
    await db.upsertTeamMatchStats({
      team_id: body.home_team_id,
      match_id: matchId,
      ...body.home_team_stats,
    });
    await db.upsertTeamMatchStats({
      team_id: body.away_team_id,
      match_id: matchId,
      ...body.away_team_stats,
    });
    console.log('  ✓ Saved team stats');

    // Save player stats (bulk upsert)
    const allPlayerStats = [
      ...body.home_player_stats.map(s => ({ ...s, match_id: matchId })),
      ...body.away_player_stats.map(s => ({ ...s, match_id: matchId })),
    ];
    
    if (allPlayerStats.length > 0) {
      await db.bulkUpsertPlayerMatchStats(allPlayerStats);
      console.log(`  ✓ Saved ${allPlayerStats.length} player stats`);
    }

    // Save actions (for heatmaps)
    if (body.actions && body.actions.length > 0) {
      await db.bulkCreateActions(body.actions);
      console.log(`  ✓ Saved ${body.actions.length} actions`);
    }

    // Save possessions
    if (body.possessions && body.possessions.length > 0) {
      await db.bulkCreatePossessions(body.possessions);
      console.log(`  ✓ Saved ${body.possessions.length} possessions`);
    }

    console.log('✅ Live stats saved successfully');
    
    return c.json({ 
      success: true,
      message: 'Live stats saved successfully',
      matchId 
    });
  } catch (error) {
    console.error('❌ Error saving live stats:', error);
    return c.json({ 
      error: 'Failed to save live stats', 
      details: error.message 
    }, 500);
  }
});

// ============ PLAYER STATS ============

app.get("/make-server-96cd1093/players/:playerId/stats", async (c) => {
  try {
    const playerId = c.req.param('playerId');
    const stats = await db.getPlayerStatsByPlayer(playerId);
    return c.json({ stats });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return c.json({ error: 'Failed to fetch player stats', details: error.message }, 500);
  }
});

app.get("/make-server-96cd1093/players/:playerId/averages", async (c) => {
  try {
    const playerId = c.req.param('playerId');
    const season = c.req.query('season');
    const averages = await db.getPlayerSeasonAverages(playerId, season);
    return c.json({ averages });
  } catch (error) {
    console.error('Error fetching player averages:', error);
    return c.json({ error: 'Failed to fetch player averages', details: error.message }, 500);
  }
});

// ============ ACTIONS (HEATMAPS) ============

app.get("/make-server-96cd1093/matches/:matchId/actions", async (c) => {
  try {
    const matchId = c.req.param('matchId');
    const actions = await db.getActionsByMatch(matchId);
    return c.json({ actions });
  } catch (error) {
    console.error('Error fetching actions:', error);
    return c.json({ error: 'Failed to fetch actions', details: error.message }, 500);
  }
});

Deno.serve(app.fetch);