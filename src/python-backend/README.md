# UC Davis Water Polo Analytics - Python Backend

This is a Python backend with Peewee ORM and FastAPI that provides a RESTful API for your water polo analytics application.

## Features

- **Peewee ORM**: Full relational database support with automatic relationship traversal
- **FastAPI**: Modern, fast API framework with automatic documentation
- **PostgreSQL**: Production-ready database (compatible with Supabase PostgreSQL)
- **Complete Models**: Teams, Players, Matches, Stats, Play-by-Play, and more
- **Query Building**: Easy filtering, sorting, and aggregation
- **Statistics**: Automatic calculation of averages and team stats

## Setup

### 1. Install Dependencies

```bash
cd python-backend
pip install -r requirements.txt
```

### 2. Configure Database

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
# For local PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/waterpolo

# OR use your Supabase PostgreSQL connection string
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

### 3. Create Tables and Seed Data

```bash
python models.py
```

This will:
- Create all database tables
- Seed UC Davis team
- Add initial 10 players

### 4. Run the Server

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --reload --port 8000
```

The API will be available at: `http://localhost:8000`

## API Documentation

FastAPI provides automatic interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Teams
- `GET /api/teams` - List all teams
- `GET /api/teams/{id}` - Get specific team
- `POST /api/teams` - Create new team

### Players
- `GET /api/players` - List all players (with filters: team_id, is_active, search)
- `GET /api/players/{id}` - Get specific player
- `POST /api/players` - Create new player
- `PATCH /api/players/{id}` - Update player
- `DELETE /api/players/{id}` - Delete player
- `GET /api/players/{id}/averages` - Get player average statistics

### Matches
- `GET /api/matches` - List all matches (filter by status)
- `GET /api/matches/{id}` - Get specific match
- `POST /api/matches` - Create new match
- `PATCH /api/matches/{id}` - Update match (scores, status, etc.)
- `GET /api/matches/{id}/stats` - Get all player stats for a match
- `POST /api/matches/{id}/stats` - Create/update player stats for a match
- `GET /api/matches/{id}/plays` - Get play-by-play for a match
- `POST /api/matches/{id}/plays` - Add play-by-play event

### Statistics
- `GET /api/teams/{id}/stats` - Get team statistics (wins, losses, goals, etc.)
- `GET /api/players/{id}/averages` - Get player averages across all games

## Example Usage from Frontend

### Fetch Players

```typescript
// Get all UC Davis players
const response = await fetch('http://localhost:8000/api/players?team_id=1');
const players = await response.json();
console.log(players);
```

### Create a Match

```typescript
const matchData = {
  uc_davis_team_id: 1,
  opponent_team_id: 2,
  match_date: new Date().toISOString(),
  location: "UC Davis Aquatic Center",
  referee_name: "John Smith"
};

const response = await fetch('http://localhost:8000/api/matches', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(matchData)
});
const newMatch = await response.json();
```

### Update Player Stats

```typescript
const statsData = {
  player_id: 1,
  goals: 5,
  assists: 2,
  shots: 8,
  steals: 3,
  // ... other stats
};

const response = await fetch(`http://localhost:8000/api/matches/${matchId}/stats`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(statsData)
});
```

### Get Player Averages

```typescript
const response = await fetch('http://localhost:8000/api/players/1/averages');
const averages = await response.json();
// Returns: avg_goals, avg_assists, shot_accuracy, etc.
```

## Database Models

### Relationships

```python
Team
 ├── players (one-to-many)
 ├── home_matches (one-to-many)
 └── away_matches (one-to-many)

Player
 ├── team (many-to-one)
 ├── match_stats (one-to-many)
 ├── plays (one-to-many)
 ├── notes (one-to-many)
 └── referee_calls (one-to-many)

Match
 ├── uc_davis_team (many-to-one)
 ├── opponent_team (many-to-one)
 ├── player_stats (one-to-many)
 ├── plays (one-to-many)
 ├── possessions (one-to-many)
 └── referee_calls (one-to-many)
```

## ORM Query Examples

### Using Peewee for Complex Queries

```python
# Get top scorers
top_scorers = (Player
    .select()
    .where(Player.team == uc_davis_team)
    .order_by(Player.total_goals.desc())
    .limit(10))

# Get match with all related data
match = (Match
    .select(Match, Team)
    .join(Team)
    .where(Match.id == match_id)
    .get())

# Get player stats with JOIN
stats = (PlayerMatchStats
    .select(PlayerMatchStats, Player, Team)
    .join(Player)
    .join(Team)
    .where(PlayerMatchStats.match == match_id))

# Aggregate queries
from peewee import fn
avg_goals = (Player
    .select(fn.AVG(Player.total_goals))
    .where(Player.team == uc_davis_team)
    .scalar())
```

## Production Deployment

### Using Supabase PostgreSQL

Your Supabase database can be used directly! Just update the `DATABASE_URL` in `.env`:

```
DATABASE_URL=postgresql://postgres.[your-project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

### Deploy Options

1. **Railway**: `railway up` (supports Python)
2. **Render**: Connect GitHub repo
3. **Heroku**: `git push heroku main`
4. **DigitalOcean App Platform**: Connect GitHub repo
5. **AWS/GCP/Azure**: Use container services

### Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Benefits Over KV Store

1. **Relational Queries**: JOIN tables, filter, sort naturally
2. **Data Integrity**: Foreign keys, constraints, transactions
3. **Automatic Relationships**: Access `player.team.name` directly
4. **Query Building**: Peewee's intuitive Python API
5. **Migrations**: Track schema changes over time
6. **Performance**: Indexed queries, efficient aggregations
7. **Type Safety**: Pydantic schemas validate all data
8. **Complex Analytics**: Easy to compute averages, rankings, trends

## Next Steps

1. Update your frontend to call these endpoints instead of the KV store
2. Add authentication (JWT tokens, API keys)
3. Implement real-time updates with WebSockets
4. Add more complex queries (season stats, player comparisons, etc.)
5. Deploy to production
