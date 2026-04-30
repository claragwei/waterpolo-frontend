import os
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from database import db
from models import (
    Team, Player, Match, PlayerMatchStats,
    PlayByPlay, RefereeCall, Possession, PlayerNote,
    create_tables,
)
from schemas import (
    TeamCreate, TeamResponse,
    PlayerCreate, PlayerUpdate, PlayerResponse,
    MatchCreate, MatchUpdate, MatchResponse,
    StatsDelta, StatsOverwrite, StatsResponse,
    PlayCreate, PlayResponse,
    RefereeCallCreate, RefereeCallResponse,
    PossessionCreate, PossessionUpdate, PossessionResponse,
    NoteCreate, NoteResponse,
)
from auth import verify_api_key

app = FastAPI(title="UC Davis Water Polo API")

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup():
    try:
        db.connect(reuse_if_open=True)
        create_tables()
        # Ensure UC Davis always exists as team ID 1
        if not Team.get_or_none(Team.id == 1):
            Team.create(id=1, name='UC Davis', short_name='UCD', is_uc_davis=True)
            # Advance the sequence so the next auto-increment doesn't collide with id=1
            db.execute_sql("SELECT setval(pg_get_serial_sequence('team', 'id'), MAX(id)) FROM team;")
        print("✅ Database connected and tables ready")
    except Exception as e:
        print(f"⚠️  Database unavailable on startup: {e}")
        print("   API will start but DB operations will fail until connection is restored.")


@app.on_event("shutdown")
async def shutdown():
    if not db.is_closed():
        db.close()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _team_to_dict(t: Team) -> dict:
    return {
        "id": t.id,
        "name": t.name,
        "short_name": t.short_name,
        "is_uc_davis": t.is_uc_davis,
        "created_at": t.created_at,
    }


def _player_to_dict(p: Player) -> dict:
    return {
        "id": p.id,
        "team_id": p.team_id,
        "name": p.name,
        "jersey_number": p.jersey_number,
        "position": p.position,
        "is_active": p.is_active,
        "total_goals": p.total_goals,
        "total_assists": p.total_assists,
        "total_shots": p.total_shots,
        "total_steals": p.total_steals,
        "total_blocks": p.total_blocks,
        "total_turnovers": p.total_turnovers,
        "total_exclusions": p.total_exclusions,
        "total_penalties": p.total_penalties,
        "created_at": p.created_at,
    }


def _match_to_dict(m: Match) -> dict:
    return {
        "id": m.id,
        "uc_davis_team_id": m.uc_davis_team_id,
        "opponent_team_id": m.opponent_team_id,
        "match_date": m.match_date,
        "location": m.location,
        "uc_davis_score": m.uc_davis_score,
        "opponent_score": m.opponent_score,
        "status": m.status,
        "current_quarter": m.current_quarter,
        "game_time": m.game_time,
        "referee_name": m.referee_name,
        "created_at": m.created_at,
    }


def _stats_to_dict(s: PlayerMatchStats) -> dict:
    return {
        "id": s.id,
        "match_id": s.match_id,
        "player_id": s.player_id,
        "shots": s.shots,
        "goals": s.goals,
        "assists": s.assists,
        "steals": s.steals,
        "blocks": s.blocks,
        "turnovers": s.turnovers,
        "penalties": s.penalties,
        "exclusions": s.exclusions,
        "rebounds": s.rebounds,
        "tipped_passes": s.tipped_passes,
        "sprints": s.sprints,
        "hustle": s.hustle,
        "draws": s.draws,
        "time_in_pool": s.time_in_pool,
    }


def _play_to_dict(p: PlayByPlay) -> dict:
    return {
        "id": p.id,
        "match_id": p.match_id,
        "quarter": p.quarter,
        "game_time": p.game_time,
        "event_type": p.event_type,
        "player_id": p.player_id,
        "team_id": p.team_id,
        "x_coordinate": p.x_coordinate,
        "y_coordinate": p.y_coordinate,
        "formation": p.formation,
        "call_type": p.call_type,
        "player_name": p.player_name,
        "player_in_id": p.player_in_id,
        "player_out_id": p.player_out_id,
        "stat_name": p.stat_name,
        "value": p.value,
        "notes": p.notes,
        "created_at": p.created_at,
    }


def _ref_call_to_dict(r: RefereeCall) -> dict:
    return {
        "id": r.id,
        "match_id": r.match_id,
        "quarter": r.quarter,
        "game_time": r.game_time,
        "call_type": r.call_type,
        "player_id": r.player_id,
        "player_name": r.player_name,
        "team_id": r.team_id,
        "created_at": r.created_at,
    }


def _possession_to_dict(p: Possession) -> dict:
    return {
        "id": p.id,
        "match_id": p.match_id,
        "team_id": p.team_id,
        "quarter": p.quarter,
        "start_time": p.start_time,
        "end_time": p.end_time,
        "outcome": p.outcome,
        "is_power_play": p.is_power_play,
    }


def _note_to_dict(n: PlayerNote) -> dict:
    return {
        "id": n.id,
        "match_id": n.match_id,
        "player_id": n.player_id,
        "note": n.note,
        "created_at": n.created_at,
    }


def update_player_career_stats(player: Player):
    stats = list(PlayerMatchStats.select().where(PlayerMatchStats.player == player))
    player.total_goals = sum(s.goals for s in stats)
    player.total_assists = sum(s.assists for s in stats)
    player.total_shots = sum(s.shots for s in stats)
    player.total_steals = sum(s.steals for s in stats)
    player.total_blocks = sum(s.blocks for s in stats)
    player.total_turnovers = sum(s.turnovers for s in stats)
    player.total_exclusions = sum(s.exclusions for s in stats)
    player.total_penalties = sum(s.penalties for s in stats)
    player.save()


# ---------------------------------------------------------------------------
# Teams
# ---------------------------------------------------------------------------

@app.get("/api/teams", response_model=List[TeamResponse])
async def get_teams(name: Optional[str] = Query(None)):
    query = Team.select()
    if name:
        query = query.where(Team.name == name)
    return [_team_to_dict(t) for t in query]


@app.get("/api/teams/{team_id}", response_model=TeamResponse)
async def get_team(team_id: int):
    team = Team.get_or_none(Team.id == team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return _team_to_dict(team)


@app.post("/api/teams", response_model=TeamResponse, dependencies=[Depends(verify_api_key)])
async def create_team(body: TeamCreate):
    team = Team.create(**body.model_dump())
    return _team_to_dict(team)


@app.get("/api/teams/{team_id}/stats")
async def get_team_stats(team_id: int):
    team = Team.get_or_none(Team.id == team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    home_matches = list(Match.select().where(Match.uc_davis_team == team_id))
    away_matches = list(Match.select().where(Match.opponent_team == team_id))
    all_matches = [m for m in home_matches + away_matches if m.status == 'completed']
    wins = losses = ties = 0
    for m in all_matches:
        is_home = m.uc_davis_team_id == team_id
        our_score = m.uc_davis_score if is_home else m.opponent_score
        their_score = m.opponent_score if is_home else m.uc_davis_score
        if our_score > their_score:
            wins += 1
        elif our_score < their_score:
            losses += 1
        else:
            ties += 1
    return {"team_id": team_id, "wins": wins, "losses": losses, "ties": ties, "games_played": len(all_matches)}


# ---------------------------------------------------------------------------
# Players
# ---------------------------------------------------------------------------

@app.get("/api/players", response_model=List[PlayerResponse])
async def get_players(
    team_id: Optional[int] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
):
    query = Player.select()
    if team_id is not None:
        query = query.where(Player.team == team_id)
    if is_active is not None:
        query = query.where(Player.is_active == is_active)
    if search:
        query = query.where(Player.name.contains(search))
    return [_player_to_dict(p) for p in query]


@app.get("/api/players/{player_id}", response_model=PlayerResponse)
async def get_player(player_id: int):
    player = Player.get_or_none(Player.id == player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return _player_to_dict(player)


@app.post("/api/players", response_model=PlayerResponse, dependencies=[Depends(verify_api_key)])
async def create_player(body: PlayerCreate):
    team = Team.get_or_none(Team.id == body.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    player = Player.create(team=team, name=body.name, jersey_number=body.jersey_number,
                           position=body.position, is_active=body.is_active)
    return _player_to_dict(player)


@app.patch("/api/players/{player_id}", response_model=PlayerResponse, dependencies=[Depends(verify_api_key)])
async def update_player(player_id: int, body: PlayerUpdate):
    player = Player.get_or_none(Player.id == player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(player, field, value)
    player.save()
    return _player_to_dict(player)


@app.delete("/api/players/{player_id}", dependencies=[Depends(verify_api_key)])
async def delete_player(player_id: int):
    player = Player.get_or_none(Player.id == player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    player.delete_instance()
    return {"detail": "Player deleted"}


@app.get("/api/players/{player_id}/averages")
async def get_player_averages(player_id: int):
    player = Player.get_or_none(Player.id == player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    stats = list(PlayerMatchStats.select().where(PlayerMatchStats.player == player_id))
    n = len(stats) or 1
    shot_attempts = sum(s.shots for s in stats)
    goals = sum(s.goals for s in stats)
    return {
        "player_id": player_id,
        "games_played": len(stats),
        "avg_goals": round(goals / n, 2),
        "avg_assists": round(sum(s.assists for s in stats) / n, 2),
        "avg_shots": round(shot_attempts / n, 2),
        "avg_steals": round(sum(s.steals for s in stats) / n, 2),
        "avg_blocks": round(sum(s.blocks for s in stats) / n, 2),
        "shot_percentage": round((goals / shot_attempts * 100) if shot_attempts else 0, 1),
    }
@app.get("/api/players/{player_id}/score")
async def get_player_score(player_id: int):
    player = Player.get_or_none(Player.id == player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    stats = list(PlayerMatchStats.select().where(PlayerMatchStats.player == player_id))
    n = len(stats) or 1

    # Per-game averages
    avg_goals    = sum(s.goals for s in stats) / n
    avg_shots    = max(sum(s.shots for s in stats) / n, 0.1)
    avg_assists  = sum(s.assists for s in stats) / n
    avg_steals   = sum(s.steals for s in stats) / n
    avg_rebounds = sum(s.rebounds for s in stats) / n
    avg_sprints  = sum(s.sprints for s in stats) / n
    avg_hustle   = sum(s.hustle for s in stats) / n
    avg_draws    = sum(s.draws for s in stats) / n

    # Normalize each stat to 0-100 (set expected max per game)
    MAX = {
        "conversion": 0.60,  # 60% conversion rate = max
        "assists":    3.0,
        "steals":     2.5,
        "rebounds":   2.0,
        "sprints":    1.5,
        "hustle":     3.0,
        "draws":      2.0,
    }

    def norm(val, max_val):
        return min(val / max_val * 100, 100)

    conv_score    = norm(avg_goals / avg_shots, MAX["conversion"])
    assist_score  = norm(avg_assists,           MAX["assists"])
    steal_score   = norm(avg_steals,            MAX["steals"])
    rebound_score = norm(avg_rebounds,          MAX["rebounds"])
    sprint_score  = norm(avg_sprints,           MAX["sprints"])
    hustle_score  = norm(avg_hustle,            MAX["hustle"])
    draw_score    = norm(avg_draws,             MAX["draws"])

    # Weighted sum
    total = round(
        conv_score    * 0.32 +
        assist_score  * 0.16 +
        steal_score   * 0.16 +
        rebound_score * 0.08 +
        sprint_score  * 0.08 +
        hustle_score  * 0.07 +
        draw_score    * 0.05
    )

    tier = (
        "elite"      if total >= 80 else
        "strong"     if total >= 60 else
        "average"    if total >= 40 else
        "developing"
    )

    return {
        "player_id":       player_id,
        "games_played":    len(stats),
        "score":           total,
        "tier":            tier,
        "conversion_rate": round(avg_goals / avg_shots * 100, 1),
        "components": {
            "goals_conversion": round(conv_score * 0.32, 1),
            "assists":          round(assist_score * 0.16, 1),
            "steals":           round(steal_score * 0.16, 1),
            "rebounds":         round(rebound_score * 0.08, 1),
            "sprints":          round(sprint_score * 0.08, 1),
            "hustle":           round(hustle_score * 0.07, 1),
            "draws":            round(draw_score * 0.05, 1),
        }
    }

# ---------------------------------------------------------------------------
# Matches
# ---------------------------------------------------------------------------

@app.get("/api/matches", response_model=List[MatchResponse])
async def get_matches(status: Optional[str] = Query(None), limit: int = Query(50)):
    query = Match.select().order_by(Match.created_at.desc()).limit(limit)
    if status:
        query = query.where(Match.status == status)
    return [_match_to_dict(m) for m in query]


@app.get("/api/matches/{match_id}", response_model=MatchResponse)
async def get_match(match_id: int):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return _match_to_dict(match)


@app.post("/api/matches", response_model=MatchResponse, dependencies=[Depends(verify_api_key)])
async def create_match(body: MatchCreate):
    uc_team = Team.get_or_none(Team.id == body.uc_davis_team_id)
    opp_team = Team.get_or_none(Team.id == body.opponent_team_id)
    if not uc_team:
        raise HTTPException(status_code=404, detail="UC Davis team not found")
    if not opp_team:
        raise HTTPException(status_code=404, detail="Opponent team not found")
    match = Match.create(
        uc_davis_team=uc_team,
        opponent_team=opp_team,
        match_date=body.match_date,
        location=body.location,
        status='in_progress',
    )
    return _match_to_dict(match)


@app.patch("/api/matches/{match_id}", response_model=MatchResponse, dependencies=[Depends(verify_api_key)])
async def update_match(match_id: int, body: MatchUpdate):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(match, field, value)
    match.save()
    return _match_to_dict(match)


# ---------------------------------------------------------------------------
# Match Stats
# ---------------------------------------------------------------------------

@app.get("/api/matches/{match_id}/stats", response_model=List[StatsResponse])
async def get_match_stats(match_id: int):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    rows = PlayerMatchStats.select().where(PlayerMatchStats.match == match_id)
    return [_stats_to_dict(s) for s in rows]


@app.post("/api/matches/{match_id}/stats", response_model=StatsResponse, dependencies=[Depends(verify_api_key)])
async def increment_match_stats(match_id: int, body: StatsDelta):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    player = Player.get_or_none(Player.id == body.player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    row = PlayerMatchStats.get_or_none(
        (PlayerMatchStats.match == match_id) & (PlayerMatchStats.player == body.player_id)
    )
    stat_fields = ['shots', 'goals', 'assists', 'steals', 'blocks', 'turnovers',
                   'penalties', 'exclusions', 'rebounds', 'tipped_passes', 'sprints',
                   'hustle', 'draws', 'time_in_pool']
    delta = body.model_dump(exclude={'player_id'}, exclude_none=True)

    if row:
        for field in stat_fields:
            if field in delta:
                setattr(row, field, getattr(row, field) + delta[field])
        row.save()
    else:
        kwargs = {f: delta.get(f, 0) for f in stat_fields}
        row = PlayerMatchStats.create(match=match, player=player, **kwargs)

    update_player_career_stats(player)
    return _stats_to_dict(row)


@app.put("/api/matches/{match_id}/stats", response_model=StatsResponse, dependencies=[Depends(verify_api_key)])
async def overwrite_match_stats(match_id: int, body: StatsOverwrite):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    player = Player.get_or_none(Player.id == body.player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    row = PlayerMatchStats.get_or_none(
        (PlayerMatchStats.match == match_id) & (PlayerMatchStats.player == body.player_id)
    )
    data = body.model_dump(exclude={'player_id'})
    if row:
        for field, value in data.items():
            setattr(row, field, value)
        row.save()
    else:
        row = PlayerMatchStats.create(match=match, player=player, **data)

    update_player_career_stats(player)
    return _stats_to_dict(row)


# ---------------------------------------------------------------------------
# Plays
# ---------------------------------------------------------------------------

@app.get("/api/matches/{match_id}/plays", response_model=List[PlayResponse])
async def get_plays(match_id: int):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    plays = PlayByPlay.select().where(PlayByPlay.match == match_id).order_by(PlayByPlay.created_at)
    return [_play_to_dict(p) for p in plays]


@app.post("/api/matches/{match_id}/plays", response_model=PlayResponse, dependencies=[Depends(verify_api_key)])
async def create_play(match_id: int, body: PlayCreate):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    player = None
    if body.player_id:
        player = Player.get_or_none(Player.id == body.player_id)

    team = None
    if body.team_id:
        team = Team.get_or_none(Team.id == body.team_id)

    play = PlayByPlay.create(
        match=match,
        quarter=body.quarter,
        game_time=body.game_time,
        event_type=body.event_type,
        player=player,
        team=team,
        x_coordinate=body.x_coordinate,
        y_coordinate=body.y_coordinate,
        formation=body.formation,
        call_type=body.call_type,
        player_name=body.player_name,
        player_in_id=body.player_in_id,
        player_out_id=body.player_out_id,
        stat_name=body.stat_name,
        value=body.value,
        notes=body.notes,
    )
    return _play_to_dict(play)


# ---------------------------------------------------------------------------
# Referee Calls
# ---------------------------------------------------------------------------

@app.get("/api/matches/{match_id}/referee-calls", response_model=List[RefereeCallResponse])
async def get_referee_calls(match_id: int):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    calls = RefereeCall.select().where(RefereeCall.match == match_id).order_by(RefereeCall.created_at)
    return [_ref_call_to_dict(c) for c in calls]


@app.post("/api/matches/{match_id}/referee-calls", response_model=RefereeCallResponse, dependencies=[Depends(verify_api_key)])
async def create_referee_call(match_id: int, body: RefereeCallCreate):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    player = Player.get_or_none(Player.id == body.player_id) if body.player_id else None
    team = Team.get_or_none(Team.id == body.team_id) if body.team_id else None

    call = RefereeCall.create(
        match=match,
        quarter=body.quarter,
        game_time=body.game_time,
        call_type=body.call_type,
        player=player,
        player_name=body.player_name,
        team=team,
    )
    return _ref_call_to_dict(call)


# ---------------------------------------------------------------------------
# Possessions
# ---------------------------------------------------------------------------

@app.get("/api/matches/{match_id}/possessions", response_model=List[PossessionResponse])
async def get_possessions(match_id: int):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    possessions = Possession.select().where(Possession.match == match_id).order_by(Possession.id)
    return [_possession_to_dict(p) for p in possessions]


@app.post("/api/matches/{match_id}/possessions", response_model=PossessionResponse, dependencies=[Depends(verify_api_key)])
async def create_possession(match_id: int, body: PossessionCreate):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    team = Team.get_or_none(Team.id == body.team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    possession = Possession.create(
        match=match, team=team, quarter=body.quarter,
        start_time=body.start_time, outcome=body.outcome,
        is_power_play=body.is_power_play,
    )
    return _possession_to_dict(possession)


@app.patch("/api/matches/{match_id}/possessions/{possession_id}", response_model=PossessionResponse, dependencies=[Depends(verify_api_key)])
async def close_possession(match_id: int, possession_id: int, body: PossessionUpdate):
    possession = Possession.get_or_none(
        (Possession.id == possession_id) & (Possession.match == match_id)
    )
    if not possession:
        raise HTTPException(status_code=404, detail="Possession not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(possession, field, value)
    possession.save()
    return _possession_to_dict(possession)


# ---------------------------------------------------------------------------
# Notes
# ---------------------------------------------------------------------------

@app.get("/api/matches/{match_id}/notes", response_model=List[NoteResponse])
async def get_notes(match_id: int):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    notes = PlayerNote.select().where(PlayerNote.match == match_id).order_by(PlayerNote.created_at)
    return [_note_to_dict(n) for n in notes]


@app.post("/api/matches/{match_id}/notes", response_model=NoteResponse, dependencies=[Depends(verify_api_key)])
async def create_note(match_id: int, body: NoteCreate):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    player = Player.get_or_none(Player.id == body.player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    note = PlayerNote.create(match=match, player=player, note=body.note)
    return _note_to_dict(note)


# ---------------------------------------------------------------------------
# Dev entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("DEBUG", "False").lower() == "true",
    )
