# Quick Start Guide - Database Integration

This guide will help you get the database integration up and running quickly.

## Prerequisites Checklist

- [ ] Supabase project created (Project ID: `cjrqpphlyurilqqccpws`)
- [ ] You have access to the Supabase dashboard
- [ ] Your Edge Functions are deployed

## Step 1: Create Database Tables (5 minutes)

1. **Open Supabase Dashboard**: Go to https://supabase.com/dashboard/project/cjrqpphlyurilqqccpws

2. **Navigate to SQL Editor**:
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**:
   - Open `/supabase/migrations/001_initial_schema.sql` in your code editor
   - Copy ALL the SQL code (it's a long file)
   - Paste it into the Supabase SQL Editor
   - Click the green "Run" button
   - Wait for "Success. No rows returned" message

4. **Verify Tables Were Created**:
   - Click "Table Editor" in the left sidebar
   - You should see these tables:
     - teams
     - players
     - matches
     - team_match_stats
     - player_match_stats
     - actions
     - possessions
     - plays
     - match_plays
     - opponent_profiles

## Step 2: Add Sample Data (2 minutes)

### Option A: Manual SQL Insert (Easiest)

Go back to the SQL Editor and run these queries one by one:

```sql
-- Insert UC Davis team
INSERT INTO teams (name, coach_name, division, season)
VALUES ('UC Davis Aggies', 'Coach Davis', 'Division 1', '2024-25')
ON CONFLICT (name, season) DO NOTHING;

-- Insert Stanford team
INSERT INTO teams (name, coach_name, division, season)
VALUES ('Stanford Cardinal', 'Coach Cardinal', 'Division 1', '2024-25')
ON CONFLICT (name, season) DO NOTHING;

-- Get the team IDs (you'll need these for the next steps)
SELECT id, name FROM teams;
```

Copy the UC Davis team ID from the results.

Then insert some sample players (replace `'YOUR-UC-DAVIS-TEAM-ID'` with the actual ID):

```sql
-- Insert UC Davis players
INSERT INTO players (team_id, first_name, last_name, jersey_number, position, is_active)
VALUES 
  ('YOUR-UC-DAVIS-TEAM-ID', 'John', 'Smith', 1, 'Attacker', true),
  ('YOUR-UC-DAVIS-TEAM-ID', 'Mike', 'Johnson', 2, 'Center', true),
  ('YOUR-UC-DAVIS-TEAM-ID', 'Chris', 'Williams', 3, 'Defender', true),
  ('YOUR-UC-DAVIS-TEAM-ID', 'David', 'Brown', 4, 'Goalie', true),
  ('YOUR-UC-DAVIS-TEAM-ID', 'James', 'Davis', 5, 'Utility', true),
  ('YOUR-UC-DAVIS-TEAM-ID', 'Robert', 'Miller', 6, 'Attacker', true),
  ('YOUR-UC-DAVIS-TEAM-ID', 'Tom', 'Wilson', 7, 'Center', true),
  ('YOUR-UC-DAVIS-TEAM-ID', 'Alex', 'Moore', 8, 'Defender', false),
  ('YOUR-UC-DAVIS-TEAM-ID', 'Sam', 'Taylor', 9, 'Utility', false),
  ('YOUR-UC-DAVIS-TEAM-ID', 'Ben', 'Anderson', 10, 'Attacker', false)
ON CONFLICT (team_id, jersey_number) DO NOTHING;
```

### Option B: Use the Seed Script (Advanced)

If you have Deno installed locally:

```bash
# Navigate to server directory
cd /supabase/functions/server

# Set environment variables
export SUPABASE_URL="https://cjrqpphlyurilqqccpws.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Run seed script
deno run --allow-net --allow-env seed.ts
```

**Note**: Get your service role key from: Supabase Dashboard → Settings → API → service_role (Keep this secret!)

## Step 3: Test the API (3 minutes)

### Test 1: Health Check

Open your browser or use curl:
```bash
curl https://cjrqpphlyurilqqccpws.supabase.co/functions/v1/make-server-96cd1093/health
```

Expected response: `{"status":"ok"}`

### Test 2: Get Teams

```bash
curl https://cjrqpphlyurilqqccpws.supabase.co/functions/v1/make-server-96cd1093/teams \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcnFwcGhseXVyaWxxcWNjcHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjg0ODQsImV4cCI6MjA4Mzg0NDQ4NH0.16KEGjk0P9j75Oe8SWuNfzuHG60ebdTWCQRQx4vARdg"
```

Expected: JSON with your teams

### Test 3: Get Players

First, get your UC Davis team ID from the teams response above, then:

```bash
curl https://cjrqpphlyurilqqccpws.supabase.co/functions/v1/make-server-96cd1093/teams/YOUR-TEAM-ID/players \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcnFwcGhseXVyaWxxcWNjcHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjg0ODQsImV4cCI6MjA4Mzg0NDQ4NH0.16KEGjk0P9j75Oe8SWuNfzuHG60ebdTWCQRQx4vARdg"
```

Expected: JSON with your players

## Step 4: Use in Your Frontend (10 minutes)

### Import the API client

```typescript
import {
  getTeams,
  getUCDavisTeam,
  getUCDavisPlayers,
  getMatches,
  createMatch,
  saveLiveStats,
} from '../api/client';
```

### Example: Load UC Davis players on page mount

```typescript
useEffect(() => {
  async function loadPlayers() {
    try {
      const players = await getUCDavisPlayers();
      console.log('Loaded players:', players);
      // Update your state
      setPlayers(players);
    } catch (error) {
      console.error('Failed to load players:', error);
    }
  }
  
  loadPlayers();
}, []);
```

### Example: Create a new match

```typescript
async function handleCreateMatch() {
  try {
    const ucDavis = await getUCDavisTeam();
    const opponent = await getTeamByName('Stanford Cardinal');
    
    const match = await createMatch({
      home_team_id: ucDavis.id,
      away_team_id: opponent.id,
      match_date: new Date().toISOString(),
      location: 'Schaal Aquatics Center',
      match_type: 'Conference',
      status: 'Live',
    });
    
    console.log('Created match:', match);
    return match;
  } catch (error) {
    console.error('Failed to create match:', error);
  }
}
```

### Example: Save live stats

```typescript
async function handleSaveLiveStats(matchId: string) {
  try {
    const result = await saveLiveStats(matchId, {
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
        cad: 6,
        ag: 3,
        agd: 2,
        six_on_five_opportunities: 8,
        five_on_six_opportunities: 6,
        seven_on_six_opportunities: 2,
        six_on_seven_opportunities: 1,
        total_possession_time_seconds: 950.5,
      },
      away_team_stats: {
        // ... similar structure
      },
      home_player_stats: [
        {
          player_id: 'player-uuid',
          shots_attempted: 5,
          goals: 3,
          assists: 2,
          // ... all other stats
        },
        // ... more players
      ],
      away_player_stats: [
        // ... opponent players
      ],
      actions: [
        // Optional: heatmap data
      ],
      possessions: [
        // Optional: possession tracking
      ],
    });
    
    console.log('Stats saved:', result);
    toast.success('Game stats saved successfully!');
  } catch (error) {
    console.error('Failed to save stats:', error);
    toast.error('Failed to save stats');
  }
}
```

## Troubleshooting

### "Failed to fetch" error
- Check that your Edge Function is deployed in Supabase
- Verify the URL is correct
- Check browser console for CORS errors

### "Table does not exist" error
- Make sure you ran the SQL migration
- Check Table Editor in Supabase dashboard to confirm tables exist

### "Authorization error"
- Verify you're using the correct `publicAnonKey` in the Authorization header
- Check that the key is not expired

### "Cannot find team" error
- Make sure you created the teams in Step 2
- Run `SELECT * FROM teams;` in SQL Editor to verify

### Empty results
- Make sure you inserted sample data in Step 2
- Check data exists: `SELECT * FROM players;`

## Next Steps

1. ✅ **Done**: Database schema created
2. ✅ **Done**: Sample data added
3. ✅ **Done**: API tested
4. ⏭️ **Next**: Update your frontend components to use real data
5. ⏭️ **Next**: Test the full flow from Live Stats → Database → Dashboard

## Key Files Reference

- `/supabase/migrations/001_initial_schema.sql` - Database schema
- `/supabase/functions/server/seed.ts` - Sample data script
- `/supabase/functions/server/index.tsx` - API server
- `/supabase/functions/server/db.ts` - Database helper functions
- `/supabase/functions/server/types.ts` - TypeScript types
- `/api/client.ts` - Frontend API client
- `/DATABASE_INTEGRATION.md` - Full documentation

---

Need help? Check the error logs in:
- Supabase Dashboard → Edge Functions → Logs
- Browser Developer Tools → Console
