# UC Davis Water Polo Analytics - Database Integration

This document explains how to set up and use the Supabase database integration for the UC Davis Water Polo Analytics platform.

## Overview

The application uses a three-tier architecture:
- **Frontend** (React/TypeScript) - UI components
- **Server** (Hono on Supabase Edge Functions) - API layer
- **Database** (PostgreSQL via Supabase) - Data storage

## Setup Instructions

### 1. Run the SQL Migration

First, you need to create the database schema. Go to your Supabase dashboard:

1. Navigate to **SQL Editor** in your Supabase project dashboard
2. Create a new query
3. Copy the entire contents of `/supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the migration

This will create all the necessary tables:
- `teams` - Water polo teams
- `players` - Individual players
- `matches` - Game records
- `team_match_stats` - Team statistics per match
- `player_match_stats` - Player statistics per match
- `actions` - Granular events for heatmaps
- `possessions` - Possession tracking
- `plays` - Strategic plays/tactics
- `match_plays` - Play usage in matches
- `opponent_profiles` - Scouting reports

### 2. Seed the Database with Sample Data

After creating the schema, you'll want to populate it with sample data.

**Option A: Run the seed script locally (if you have Deno installed)**
```bash
cd /supabase/functions/server
deno run --allow-net --allow-env seed.ts
```

**Option B: Copy seed data via Supabase SQL Editor**

If you don't have Deno installed, you can manually run parts of the seed script through the SQL editor. The seed script creates:
- UC Davis Aggies team
- Stanford Cardinal team  
- UC Berkeley Golden Bears team
- 13 players per team
- 2 sample matches (1 completed, 1 upcoming)
- Player and team statistics
- Action events for heatmaps

### 3. Verify the Setup

Test that your server is running properly:

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions**
3. Find the `make-server-96cd1093` function
4. Click **Invoke** to test it
5. Or visit: `https://cjrqpphlyurilqqccpws.supabase.co/functions/v1/make-server-96cd1093/health`

You should see: `{"status": "ok"}`

Test the teams endpoint:
`https://cjrqpphlyurilqqccpws.supabase.co/functions/v1/make-server-96cd1093/teams`

You should see a JSON response with your teams.

## API Endpoints

The server provides the following endpoints (all prefixed with `/make-server-96cd1093`):

### Teams
- `GET /teams` - Get all teams
- `GET /teams/:id` - Get team by ID
- `POST /teams` - Create a new team

### Players
- `GET /teams/:teamId/players` - Get all players for a team
- `GET /teams/:teamId/players-with-stats` - Get players with aggregated statistics
- `GET /players/:id` - Get player by ID
- `POST /players` - Create a new player
- `PUT /players/:id` - Update a player
- `GET /players/:playerId/stats` - Get all match stats for a player
- `GET /players/:playerId/averages` - Get season averages for a player

### Matches
- `GET /matches` - Get all matches
- `GET /matches/:id` - Get match by ID (includes team stats, player stats, actions)
- `POST /matches` - Create a new match
- `PUT /matches/:id` - Update a match
- `POST /matches/:id/save-live-stats` - Save comprehensive live stats data

### Actions (Heatmaps)
- `GET /matches/:matchId/actions` - Get all actions for a match (for heatmap generation)

## Frontend Integration

### Making API Requests

All frontend requests should go through the server. Example:

```typescript
import { projectId, publicAnonKey } from './utils/supabase/info';

const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-96cd1093`;

// Get all teams
async function getTeams() {
  const response = await fetch(`${apiUrl}/teams`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch teams');
  }
  
  const data = await response.json();
  return data.teams;
}

// Get players for UC Davis
async function getUCDavisPlayers(teamId: string) {
  const response = await fetch(`${apiUrl}/teams/${teamId}/players`, {
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  return data.players;
}

// Create a new match
async function createMatch(matchData) {
  const response = await fetch(`${apiUrl}/matches`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(matchData),
  });
  
  const data = await response.json();
  return data.match;
}
```

### Saving Live Stats from LiveStatsPageDual

When users click "Save" in the Live Stats page, you should compile all the data and send it to the save-live-stats endpoint:

```typescript
async function saveLiveStats(matchId: string) {
  const payload = {
    match_id: matchId,
    home_team_id: ucDavisTeamId,
    away_team_id: opponentTeamId,
    home_score: 12,
    away_score: 10,
    quarter_scores: {
      q1: [3, 2],
      q2: [3, 3],
      q3: [4, 2],
      q4: [2, 3],
    },
    home_team_stats: {
      fco: 24,
      fcd: 20,
      cao: 8,
      // ... other team stats
    },
    away_team_stats: {
      fco: 22,
      fcd: 22,
      // ... other team stats
    },
    home_player_stats: [
      {
        player_id: 'uuid-here',
        shots_attempted: 5,
        goals: 3,
        assists: 2,
        // ... other player stats
      },
      // ... more players
    ],
    away_player_stats: [
      // ... opponent player stats
    ],
    actions: [
      {
        match_id: matchId,
        team_id: ucDavisTeamId,
        player_id: 'uuid-here',
        action_type: 'Goal',
        quarter: 1,
        game_clock_seconds: 450,
        coordinate_x: 75.5,
        coordinate_y: 42.3,
        formation: '4-2',
        result: 'Made',
      },
      // ... more actions for heatmaps
    ],
    possessions: [
      // ... possession data
    ],
  };

  const response = await fetch(
    `${apiUrl}/matches/${matchId}/save-live-stats`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.details || 'Failed to save stats');
  }

  return await response.json();
}
```

## Database Schema Notes

### Key Relationships

- **Teams** have many **Players**
- **Matches** belong to two **Teams** (home and away)
- **TeamMatchStats** links a **Team** to a **Match** with aggregate stats
- **PlayerMatchStats** links a **Player** to a **Match** with individual stats
- **Actions** are granular events (shots, goals, assists) with coordinates for heatmaps
- **Possessions** track team possession periods for flow analysis

### Important Fields

**Player Stats:**
- All the stats from your Live Stats page (shots, goals, assists, steals, blocks, turnovers, etc.)
- `is_active` - Whether player is currently on roster

**Team Stats:**
- FCO/FCD - Front Court Offense/Defense
- CAO/CAD - Counter Attack Offense/Defense
- AG/AGD - After Goal situations
- Six-on-five opportunities, etc.

**Actions (for Heatmaps):**
- `coordinate_x`, `coordinate_y` - Shot location (0-100 scale)
- `formation` - '4-2' or '3-3'
- `action_type` - 'Goal', 'Shot', 'Assist', etc.
- `result` - 'Made', 'Missed', 'Blocked', 'Saved'

## Next Steps

1. **Run the migration** to create tables
2. **Run the seed script** to populate sample data
3. **Update your frontend components** to fetch real data from the API
4. **Test the Live Stats save functionality** to ensure data persists correctly

## Troubleshooting

**"Failed to fetch" errors:**
- Check that your Supabase Edge Function is deployed
- Verify the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables are set in your Supabase project

**"Table does not exist" errors:**
- Make sure you ran the migration SQL in the Supabase SQL Editor

**CORS errors:**
- The server already has CORS configured for `*` origin, so this shouldn't be an issue

**Authentication errors:**
- Make sure you're using the correct `publicAnonKey` in the Authorization header

## Architecture Benefits

This three-tier architecture provides:
- **Security**: Service role key never exposed to frontend
- **Flexibility**: Easy to add business logic, validation, or transformations in the server layer
- **Scalability**: Server can cache, batch operations, or optimize queries
- **Maintainability**: Clear separation of concerns

---

For questions or issues, check the server logs in the Supabase Edge Functions dashboard.
