# Integration Guide: Python Backend + React Frontend

This guide shows how to integrate the Python backend with your existing React water polo app.

## Architecture

```
┌─────────────────┐
│  React Frontend │
│  (Port 5173)    │
└────────┬────────┘
         │ HTTP/REST
         ▼
┌─────────────────┐
│  Python API     │
│  FastAPI+Peewee │
│  (Port 8000)    │
└────────┬────────┘
         │ SQL
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  (Supabase or   │
│   Local)        │
└─────────────────┘
```

## Step 1: Start Python Backend

```bash
cd python-backend
chmod +x start.sh
./start.sh
```

Or manually:
```bash
pip install -r requirements.txt
python models.py  # Create tables
python main.py    # Start server
```

Server runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

## Step 2: Create API Client in React

Create `/src/services/api.ts`:

```typescript
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
```

## Step 3: Update Your Components

### Example: Player List Component

**Before (using KV store):**
```typescript
// Old way with KV store
import * as kv from './supabase/functions/server/kv_store';

const PlayerList = () => {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    const fetchPlayers = async () => {
      const allPlayers = await kv.getByPrefix('player:');
      const ucDavisPlayers = allPlayers.filter(p => p.teamId === 1);
      setPlayers(ucDavisPlayers);
    };
    fetchPlayers();
  }, []);

  // ...
};
```

**After (using Python API):**
```typescript
// New way with Python API
import { api, usePlayers } from './services/api';

const PlayerList = () => {
  const { players, loading } = usePlayers(1); // UC Davis team ID

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {players.map(player => (
        <div key={player.id}>
          #{player.jersey_number} {player.name} - {player.total_goals} goals
        </div>
      ))}
    </div>
  );
};
```

### Example: Live Stats Page Integration

Update your `LiveStatsPageDual` component:

```typescript
import { api } from './services/api';

const LiveStatsPageDual = () => {
  const [matchId, setMatchId] = useState<number | null>(null);
  
  // Start a new match
  const startMatch = async () => {
    const match = await api.createMatch({
      uc_davis_team_id: 1,
      opponent_team_id: 2,
      match_date: new Date().toISOString(),
      location: 'UC Davis Aquatic Center'
    });
    setMatchId(match.id);
  };

  // Update player stats
  const updatePlayerStat = async (playerId: number, stat: string, value: number) => {
    if (!matchId) return;
    
    const statsUpdate = {
      player_id: playerId,
      [stat]: value
    };
    
    await api.updateMatchStats(matchId, playerId, statsUpdate);
  };

  // Record a goal
  const handleGoal = async (playerId: number) => {
    if (!matchId) return;
    
    // Update stats
    await api.updateMatchStats(matchId, playerId, {
      player_id: playerId,
      goals: currentGoals + 1,
      shots: currentShots + 1
    });
    
    // Record play-by-play
    await fetch(`http://localhost:8000/api/matches/${matchId}/plays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: playerId,
        quarter: currentQuarter,
        game_time: gameTime,
        event_type: 'goal',
        x_coordinate: x,
        y_coordinate: y
      })
    });
  };

  // ...rest of component
};
```

### Example: Player Insights Page

```typescript
import { usePlayerStats } from './services/api';

const PlayerInsights = ({ playerId }: { playerId: number }) => {
  const { stats, loading } = usePlayerStats(playerId);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>{stats.player_name} - #{stats.jersey_number}</h2>
      <div>Games Played: {stats.games_played}</div>
      <div>Avg Goals: {stats.avg_goals.toFixed(2)}</div>
      <div>Avg Assists: {stats.avg_assists.toFixed(2)}</div>
      <div>Shot Accuracy: {stats.shot_accuracy}%</div>
    </div>
  );
};
```

## Step 4: Environment Variables

Update your `.env` file:

```
VITE_API_URL=http://localhost:8000/api
# For production: https://your-api-domain.com/api
```

Use in code:
```typescript
const API_BASE = import.meta.env.VITE_API_URL;
```

## Step 5: CORS Configuration

The Python backend already has CORS enabled for `http://localhost:5173` (Vite default port).

If you use a different port, update `python-backend/.env`:
```
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Step 6: Testing the Integration

1. Start Python backend:
   ```bash
   cd python-backend
   python main.py
   ```

2. Start React frontend:
   ```bash
   npm run dev
   ```

3. Test API in browser console:
   ```javascript
   fetch('http://localhost:8000/api/players?team_id=1')
     .then(r => r.json())
     .then(console.log)
   ```

## Step 7: Replace KV Store Calls

Gradually replace your KV store calls:

| Old KV Store | New Python API |
|--------------|----------------|
| `kv.get('player:1')` | `api.getPlayer(1)` |
| `kv.getByPrefix('player:')` | `api.getPlayers()` |
| `kv.set('player:1', data)` | `api.updatePlayer(1, data)` |
| Manual filtering | Database queries |
| Manual aggregation | `api.getPlayerAverages(id)` |

## Benefits You'll See Immediately

1. **Faster Queries**: Database indexes make searches instant
2. **Less Code**: No manual filtering/sorting logic
3. **Type Safety**: Pydantic validates all data
4. **Relationships**: `player.team.name` works automatically
5. **Statistics**: Built-in averages, aggregations
6. **Search**: Database-powered player/team search
7. **Data Integrity**: Foreign keys prevent bad data

## Production Deployment

### Deploy Python Backend

**Option 1: Railway**
```bash
cd python-backend
railway login
railway init
railway up
```

**Option 2: Render**
1. Connect GitHub repo
2. Select `python-backend` directory
3. Add DATABASE_URL environment variable

**Option 3: Fly.io**
```bash
cd python-backend
fly launch
fly deploy
```

### Update Frontend

Update API URL:
```
VITE_API_URL=https://your-api.railway.app/api
```

## Next Steps

1. ✅ Set up Python backend locally
2. ✅ Create initial tables and seed data
3. ✅ Test API endpoints with Swagger UI
4. ✅ Update one React component to use new API
5. ✅ Gradually migrate other components
6. ✅ Deploy to production
7. ✅ Remove old KV store code

## Need Help?

- API Documentation: http://localhost:8000/docs
- Test endpoints in Swagger UI
- Check Python backend logs for errors
- Use browser DevTools Network tab to debug API calls
