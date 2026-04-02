# Server Architecture

## Status

The backend is **partially implemented**. Do not modify any frontend code — the API must conform to the contracts the frontend already uses in `src/services/api.ts` and `LiveStatsPageDual.tsx`.

---

## File Structure

```
backend/
├── main.py        # App factory, CORS, startup hooks, all route handlers
├── models.py      # Peewee model classes (tables)
├── schemas.py     # Pydantic models for request validation and response serialization
├── database.py    # DB instance, connect/close helpers
├── auth.py        # API key dependency
├── .env
└── requirements.txt
```

---

## Database Connection (`database.py`) — NEEDS IMPLEMENTATION

```python
import os
from peewee import PostgresqlDatabase
from urllib.parse import urlparse

url = urlparse(os.getenv("DATABASE_URL"))
db = PostgresqlDatabase(
    url.path[1:],
    user=url.username,
    password=url.password,
    host=url.hostname,
    port=url.port,
    autorollback=True,
    sslmode='require',  # Required for Supabase — do not omit
)
```

The `db` object is imported by `models.py` and `main.py`. Startup/shutdown lifecycle hooks in `main.py` call `db.connect()` and `db.close()`.

---

## Authentication (`auth.py`) — NEEDS IMPLEMENTATION

Simple API key header auth. The frontend sends `X-API-Key` on all write requests.

```python
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader
import os

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(key: str = Security(api_key_header)):
    if key != os.getenv("API_KEY"):
        raise HTTPException(status_code=403, detail="Invalid or missing API key")
    return key
```

Apply to all POST, PATCH, DELETE routes: `dependencies=[Depends(verify_api_key)]`.
GET routes can remain open (read-only, no sensitive writes).

---

## Models (`models.py`) — NEEDS IMPLEMENTATION

```python
from peewee import *
from datetime import datetime
from database import db

class BaseModel(Model):
    class Meta:
        database = db
```

### Team
```python
class Team(BaseModel):
    name = CharField()
    short_name = CharField()
    is_uc_davis = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.now)
```

### Player
```python
class Player(BaseModel):
    team = ForeignKeyField(Team, backref='players')
    name = CharField()
    jersey_number = IntegerField()
    position = CharField(null=True)        # 'field' | 'goalie'
    is_active = BooleanField(default=True)
    # Denormalized career totals — updated after every match stat upsert
    total_goals = IntegerField(default=0)
    total_assists = IntegerField(default=0)
    total_shots = IntegerField(default=0)
    total_steals = IntegerField(default=0)
    total_blocks = IntegerField(default=0)
    total_turnovers = IntegerField(default=0)
    total_exclusions = IntegerField(default=0)
    total_penalties = IntegerField(default=0)
    created_at = DateTimeField(default=datetime.now)
```

### Match
```python
class Match(BaseModel):
    uc_davis_team = ForeignKeyField(Team, backref='home_matches')
    opponent_team = ForeignKeyField(Team, backref='away_matches')
    match_date = DateTimeField()
    location = CharField(null=True)
    uc_davis_score = IntegerField(default=0)
    opponent_score = IntegerField(default=0)
    status = CharField(default='scheduled')  # 'scheduled' | 'in_progress' | 'completed'
    current_quarter = IntegerField(default=1)
    game_time = CharField(null=True)         # MM:SS string, owned by client
    referee_name = CharField(null=True)
    created_at = DateTimeField(default=datetime.now)
```

### PlayerMatchStats
```python
class PlayerMatchStats(BaseModel):
    match = ForeignKeyField(Match, backref='player_stats')
    player = ForeignKeyField(Player, backref='match_stats')
    shots = IntegerField(default=0)
    goals = IntegerField(default=0)
    assists = IntegerField(default=0)
    steals = IntegerField(default=0)
    blocks = IntegerField(default=0)
    turnovers = IntegerField(default=0)
    penalties = IntegerField(default=0)
    exclusions = IntegerField(default=0)
    rebounds = IntegerField(default=0)
    tipped_passes = IntegerField(default=0)
    sprints = IntegerField(default=0)
    hustle = IntegerField(default=0)
    draws = IntegerField(default=0)
    time_in_pool = IntegerField(default=0)   # seconds

    class Meta:
        indexes = ((('match', 'player'), True),)  # unique constraint
```

### PlayByPlay
Handles many event types from the frontend. The `event_type` column determines how to interpret the optional fields.

```python
class PlayByPlay(BaseModel):
    match = ForeignKeyField(Match, backref='plays')
    quarter = IntegerField()
    game_time = IntegerField()               # seconds elapsed (frontend sends raw gameTime int)
    event_type = CharField()
    # event_type values used by frontend:
    #   'goal' | 'shot' | 'assist' | 'steal' | 'turnover' | 'exclusion'
    #   'referee_call' | 'substitution' | 'team_stat'
    player = ForeignKeyField(Player, null=True, backref='plays')
    team = ForeignKeyField(Team, null=True, backref='plays')
    # Heatmap fields (used when event_type is 'goal' | 'shot' | 'assist')
    x_coordinate = FloatField(null=True)     # 0–100 percentage on pool diagram
    y_coordinate = FloatField(null=True)
    formation = CharField(null=True)         # '4-2' | '3-3'
    # Referee call fields
    call_type = CharField(null=True)
    player_name = CharField(null=True)       # denormalized for calls without a player FK
    # Substitution fields
    player_in_id = IntegerField(null=True)
    player_out_id = IntegerField(null=True)
    # Team stat fields
    stat_name = CharField(null=True)         # 'FCO' | 'FCD' | 'CAO' | etc.
    value = IntegerField(null=True)
    notes = TextField(null=True)
    created_at = DateTimeField(default=datetime.now)
```

### RefereeCall
```python
class RefereeCall(BaseModel):
    match = ForeignKeyField(Match, backref='referee_calls')
    quarter = IntegerField()
    game_time = IntegerField()               # seconds elapsed
    call_type = CharField()
    # 'yellow-card' | 'red-card' | 'ejection' | 'offensive-foul'
    # 'defensive-foul' | 'brutality' | 'timeout'
    player = ForeignKeyField(Player, null=True, backref='referee_calls')
    player_name = CharField(null=True)       # denormalized for calls without a Player row
    team = ForeignKeyField(Team, null=True, backref='referee_calls')
    created_at = DateTimeField(default=datetime.now)
```

### Possession
```python
class Possession(BaseModel):
    match = ForeignKeyField(Match, backref='possessions')
    team = ForeignKeyField(Team, backref='possessions')
    quarter = IntegerField()
    start_time = IntegerField()              # seconds into possession timer at start
    end_time = IntegerField(null=True)       # null = still active
    outcome = CharField(null=True)           # 'goal' | 'turnover' | 'steal'
    is_power_play = BooleanField(default=False)
```

### PlayerNote
```python
class PlayerNote(BaseModel):
    match = ForeignKeyField(Match, null=True, backref='player_notes')
    player = ForeignKeyField(Player, backref='notes')
    note = TextField()                       # stored with timestamp prefix: "[MM:SS Q1] text"
    created_at = DateTimeField(default=datetime.now)
```

### Table Creation
```python
def create_tables():
    with db:
        db.create_tables([
            Team, Player, Match, PlayerMatchStats,
            PlayByPlay, RefereeCall, Possession, PlayerNote
        ], safe=True)
```

---

## API Routes

### Teams
| Method | Path | Description |
|---|---|---|
| GET | `/api/teams` | List all teams — supports `?name=` filter for opponent lookup-or-create |
| GET | `/api/teams/{id}` | Get team by ID |
| POST | `/api/teams` | Create team |
| GET | `/api/teams/{id}/stats` | Win/loss + aggregate stats |

### Players
| Method | Path | Description |
|---|---|---|
| GET | `/api/players` | List (filter: `team_id`, `is_active`, `search`) |
| GET | `/api/players/{id}` | Get with team |
| POST | `/api/players` | Create |
| PATCH | `/api/players/{id}` | Update |
| DELETE | `/api/players/{id}` | Delete |
| GET | `/api/players/{id}/averages` | Per-game averages + shot% |

### Matches
| Method | Path | Description |
|---|---|---|
| GET | `/api/matches` | List (filter: `status`, `limit`) |
| GET | `/api/matches/{id}` | Get with teams |
| POST | `/api/matches` | Create — called by frontend `handleStartGame` |
| PATCH | `/api/matches/{id}` | Update score, clock, status, quarter |

### Match Sub-Resources
| Method | Path | Notes |
|---|---|---|
| GET | `/api/matches/{id}/stats` | All player stat lines |
| POST | `/api/matches/{id}/stats` | Delta increment — mid-game per-tap sync |
| PUT | `/api/matches/{id}/stats` | Full overwrite — end-of-game reconciliation |
| GET | `/api/matches/{id}/plays` | Play-by-play log |
| POST | `/api/matches/{id}/plays` | Append event — called by nearly every frontend action |
| GET | `/api/matches/{id}/referee-calls` | ❌ Not yet implemented |
| POST | `/api/matches/{id}/referee-calls` | ❌ Not yet implemented — called by `addRefereeCall` |
| GET | `/api/matches/{id}/possessions` | ❌ Not yet implemented |
| POST | `/api/matches/{id}/possessions` | ❌ Not yet implemented |
| PATCH | `/api/matches/{id}/possessions/{pid}` | ❌ Not yet implemented — close a possession |
| GET | `/api/matches/{id}/notes` | ❌ Not yet implemented |
| POST | `/api/matches/{id}/notes` | ❌ Not yet implemented — called by `handleAddNote` |

---

## Key Business Logic

### Stat Sync — Two Distinct Endpoints

The frontend uses **two different HTTP methods** for stat updates with different semantics:

**`POST /api/matches/{id}/stats` — Delta increment (mid-game)**
Called on every button tap during live tracking. The body is a partial delta.
Example: `{ player_id: 3, goals: 1, shots: 1 }`
Server behavior:
1. `get_or_none` for existing `(match, player)` row.
2. If found: **increment** each provided field by the delta value.
3. If not found: create row with provided values as initial counts.
4. Call `update_player_career_stats(player)` after every upsert.

**`PUT /api/matches/{id}/stats` — Full overwrite (end-of-game sync)**
Called once by `handleEndGame` with complete stat totals for every player.
Example: `{ player_id: 3, goals: 2, shots: 5, assists: 1, steals: 0, ... }`
Server behavior:
1. `get_or_none` for existing `(match, player)` row.
2. If found: **replace all fields** with the provided values (do not increment).
3. If not found: create row with provided values.
4. Call `update_player_career_stats(player)` after every upsert.

This design means mid-game incremental calls are best-effort telemetry, and the end-of-game PUT is the reliable commit that reconciles any dropped incremental calls.

### `POST /api/matches/{id}/plays` — Polymorphic Events
The frontend calls this for many different event types. Accept all optional fields and store what's provided. Do not require fields that only apply to certain event types.

### Opponent Team — Lookup-or-Create

`GET /api/teams` must support a `?name=` query parameter for exact-match lookup. `handleStartGame` calls `GET /api/teams?name=Stanford` first — if a result is returned, the existing team ID is reused. Only if no match is found does it call `POST /api/teams`. This preserves cross-game history for recurring conference opponents.

The backend `GET /api/teams` handler must therefore support:
```python
@app.get("/api/teams", response_model=List[TeamResponse])
async def get_teams(name: Optional[str] = None):
    query = Team.select()
    if name:
        query = query.where(Team.name == name)  # exact match, not contains
    return list(query)
```

### Seeded Data

UC Davis must always be team ID 1. Seed it on startup if not present:
```python
@app.on_event("startup")
async def startup():
    db.connect()
    create_tables()
    # Ensure UC Davis exists as team ID 1
    if not Team.get_or_none(Team.id == 1):
        Team.create(id=1, name='UC Davis', short_name='UCD', is_uc_davis=True)
```

---

## Error Handling

- All routes: `404` with `detail` if a referenced object doesn't exist.
- `422` automatically from FastAPI/Pydantic for malformed bodies.
- FK lookups wrapped in `try/except Model.DoesNotExist`.
- The frontend uses `try/catch` on all API calls and falls back to local mode — so API errors will not crash the UI, but they will silently drop data. Return meaningful `detail` strings to aid debugging.

---

## `requirements.txt`
```
fastapi
uvicorn[standard]
peewee
psycopg2-binary
pydantic
python-dotenv
```

---

## Running Locally

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in DATABASE_URL and API_KEY
python main.py
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```
