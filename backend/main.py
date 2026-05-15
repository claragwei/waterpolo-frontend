import os
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

from fastapi import FastAPI, Depends, HTTPException, Query
from peewee import fn
from fastapi.middleware.cors import CORSMiddleware

from database import db
from models import (
    Team, Player, Match, PlayerMatchStats,
    PlayByPlay, RefereeCall, Possession, PlayerNote, MatchVideoSync,
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
    MatchVideoSyncUpsert, MatchVideoSyncResponse,
)
from auth import verify_api_key

app = FastAPI(title="UC Davis Water Polo API")


@app.get("/api/health")
async def health():
    """Cheap check that the API process is up (does not hit the database)."""
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

def _parse_cors_origins() -> list[str]:
    raw = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174,"
        "http://localhost:4173,http://127.0.0.1:4173,"
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    out: list[str] = []
    for part in raw.split(","):
        o = part.strip().strip('"').strip("'")
        if o:
            out.append(o)
    return out


# Browsers send Origin on cross-site requests. Starlette returns 400 on preflight if the
# origin is not listed here AND does not match allow_origin_regex.
# NOTE: Setting CORS_ORIGIN_REGEX to an empty string in a host dashboard used to disable
# the regex entirely; we treat "" as "use default" so deploys don't silently break Vercel.
_DEFAULT_CORS_REGEX = r"https://.+\.(vercel\.app|netlify\.app|lovable\.app)(:\d+)?$"
_origins = _parse_cors_origins()
_cors_regex_raw = os.getenv("CORS_ORIGIN_REGEX")
if _cors_regex_raw is None:
    _cors_regex_val: str | None = _DEFAULT_CORS_REGEX
else:
    s = _cors_regex_raw.strip()
    if s.lower() in ("off", "none", "false", "-"):
        _cors_regex_val = None
    elif s == "":
        _cors_regex_val = _DEFAULT_CORS_REGEX
    else:
        _cors_regex_val = s

_cors_kw: dict = {
    "allow_origins": _origins,
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}
if _cors_regex_val:
    _cors_kw["allow_origin_regex"] = _cors_regex_val

app.add_middleware(CORSMiddleware, **_cors_kw)
print(
    f"CORS: {len(_origins)} explicit origin(s); "
    f"allow_origin_regex={'disabled' if not _cors_regex_val else _cors_regex_val!r}"
)

# ---------------------------------------------------------------------------
# Lifecycle
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup():
    try:
        db.connect(reuse_if_open=True)
        create_tables()
        migrations = [
            "ALTER TABLE player ADD COLUMN IF NOT EXISTS photo_url VARCHAR(512);",
            "ALTER TABLE player ADD COLUMN IF NOT EXISTS total_goals INTEGER DEFAULT 0;",
            "ALTER TABLE player ADD COLUMN IF NOT EXISTS total_assists INTEGER DEFAULT 0;",
            "ALTER TABLE player ADD COLUMN IF NOT EXISTS total_shots INTEGER DEFAULT 0;",
            "ALTER TABLE player ADD COLUMN IF NOT EXISTS total_steals INTEGER DEFAULT 0;",
            "ALTER TABLE player ADD COLUMN IF NOT EXISTS total_blocks INTEGER DEFAULT 0;",
            "ALTER TABLE player ADD COLUMN IF NOT EXISTS total_turnovers INTEGER DEFAULT 0;",
            "ALTER TABLE player ADD COLUMN IF NOT EXISTS total_exclusions INTEGER DEFAULT 0;",
            "ALTER TABLE player ADD COLUMN IF NOT EXISTS total_penalties INTEGER DEFAULT 0;",
            "ALTER TABLE playermatchstats ADD COLUMN IF NOT EXISTS score DOUBLE PRECISION DEFAULT 0;",
        ]
        for sql in migrations:
            try:
                db.execute_sql(sql)
            except Exception as mig_e:
                print(f"   (migration skipped: {mig_e})")
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
        "photo_url": getattr(p, "photo_url", None),
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
        "score": float(s.score or 0),
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


def _video_sync_to_dict(v: MatchVideoSync) -> dict:
    return {
        "id": v.id,
        "match_id": v.match_id,
        "quarter": v.quarter,
        "video_url": v.video_url,
        "video_offset_sec": v.video_offset_sec,
        "created_at": v.created_at,
        "updated_at": v.updated_at,
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

def compute_and_save_score(row: PlayerMatchStats):
    shots = max(row.shots, 0.1)

    MAX = {
        "conversion": 0.60,
        "assists":    3.0,
        "steals":     2.5,
        "rebounds":   2.0,
        "sprints":    1.5,
        "hustle":     3.0,
        "draws":      2.0,
    }

    def norm(val, max_val):
        return min(val / max_val * 100, 100)

    conv_score    = norm(row.goals / shots,  MAX["conversion"])
    assist_score  = norm(row.assists,        MAX["assists"])
    steal_score   = norm(row.steals,         MAX["steals"])
    rebound_score = norm(row.rebounds,       MAX["rebounds"])
    sprint_score  = norm(row.sprints,        MAX["sprints"])
    hustle_score  = norm(row.hustle,         MAX["hustle"])
    draw_score    = norm(row.draws,          MAX["draws"])

    row.score = round(
        conv_score    * 0.32 +
        assist_score  * 0.16 +
        steal_score   * 0.16 +
        rebound_score * 0.08 +
        sprint_score  * 0.08 +
        hustle_score  * 0.07 +
        draw_score    * 0.05,
        1
    )
    row.save()


def _score_tier(score: float) -> str:
    if score >= 80:
        return "elite"
    if score >= 60:
        return "strong"
    if score >= 40:
        return "average"
    return "developing"


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


@app.get("/api/players/batch-summary")
async def players_batch_summary(team_id: int = Query(1, ge=1)):
    """
    One request for roster + season aggregates (leaderboard) to avoid N+1
    averages/history calls from the insights page.
    """
    players = list(Player.select().where((Player.team == team_id) & (Player.is_active == True)))
    if not players:
        return []

    rows = (
        PlayerMatchStats.select(
            PlayerMatchStats.player,
            fn.COUNT(PlayerMatchStats.id).alias("games"),
            fn.SUM(PlayerMatchStats.goals).alias("total_goals"),
            fn.SUM(PlayerMatchStats.shots).alias("total_shots"),
            fn.SUM(PlayerMatchStats.assists).alias("total_assists"),
            fn.SUM(PlayerMatchStats.steals).alias("total_steals"),
            fn.SUM(PlayerMatchStats.blocks).alias("total_blocks"),
        )
        .join(Player)
        .where(Player.team == team_id)
        .group_by(PlayerMatchStats.player)
    )
    by_player: dict[int, dict] = {}
    for r in rows:
        pid = r.player.id
        shots = int(r.total_shots or 0)
        goals = int(r.total_goals or 0)
        by_player[pid] = {
            "games_played": int(r.games or 0),
            "total_goals": goals,
            "total_shots": shots,
            "total_assists": int(r.total_assists or 0),
            "total_steals": int(r.total_steals or 0),
            "total_blocks": int(r.total_blocks or 0),
            "shot_percentage": round((goals / shots * 100) if shots else 0.0, 1),
        }

    out: list[dict] = []
    for p in players:
        agg = by_player.get(p.id, {})
        games = agg.get("games_played", 0)
        out.append(
            {
                **_player_to_dict(p),
                "games_played": games,
                "total_goals": agg.get("total_goals", 0),
                "total_shots": agg.get("total_shots", 0),
                "total_assists": agg.get("total_assists", 0),
                "total_steals": agg.get("total_steals", 0),
                "total_blocks": agg.get("total_blocks", 0),
                "shot_percentage": agg.get("shot_percentage", 0.0),
            }
        )
    return out


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
    player = Player.create(
        team=team,
        name=body.name,
        jersey_number=body.jersey_number,
        position=body.position,
        is_active=body.is_active,
        photo_url=body.photo_url,
    )
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

# Score for a single game
@app.get("/api/players/{player_id}/stats/{match_id}/score")
async def get_player_game_score(player_id: int, match_id: int):
    row = PlayerMatchStats.get_or_none(
        (PlayerMatchStats.player == player_id) &
        (PlayerMatchStats.match == match_id)
    )
    if not row:
        raise HTTPException(status_code=404, detail="Stats not found")
    return {
        "player_id": player_id,
        "match_id":  match_id,
        "score":     row.score,
        "tier":      _score_tier(row.score),
    }


# Score for every game a player has played
@app.get("/api/players/{player_id}/scores")
async def get_player_all_scores(player_id: int):
    player = Player.get_or_none(Player.id == player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    rows = PlayerMatchStats.select().where(PlayerMatchStats.player == player_id)
    scores = [{"match_id": r.match_id, "score": r.score, "tier": _score_tier(r.score)} for r in rows]
    avg = round(sum(s["score"] for s in scores) / len(scores), 1) if scores else 0
    return {
        "player_id":   player_id,
        "games_played": len(scores),
        "avg_score":   avg,
        "games":       scores,
    }


# Scores for all players in a match
@app.get("/api/matches/{match_id}/scores")
async def get_match_scores(match_id: int):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    rows = PlayerMatchStats.select().where(PlayerMatchStats.match == match_id)
    return sorted(
        [{"player_id": r.player_id, "score": r.score, "tier": _score_tier(r.score)} for r in rows],
        key=lambda x: x["score"],
        reverse=True,
    )



@app.get("/api/players/{player_id}/match-history")
async def player_match_history(player_id: int, limit: int = Query(40)):
    player = Player.get_or_none(Player.id == player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    q = (
        PlayerMatchStats.select(PlayerMatchStats, Match)
        .join(Match, on=(PlayerMatchStats.match == Match.id))
        .where(PlayerMatchStats.player == player_id)
        .order_by(Match.match_date.desc())
        .limit(limit)
    )
    out: list[dict] = []
    for s in q:
        m = s.match
        opp = Team.get_or_none(Team.id == m.opponent_team_id)
        out.append(
            {
                "match_id": m.id,
                "match_date": m.match_date.isoformat() if hasattr(m.match_date, "isoformat") else str(m.match_date),
                "opponent_name": opp.name if opp else "?",
                "goals": s.goals,
                "shots": s.shots,
                "assists": s.assists,
                "steals": s.steals,
                "blocks": s.blocks,
                "turnovers": s.turnovers,
            }
        )
    return out


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
    status = body.status or "scheduled"
    match = Match.create(
        uc_davis_team=uc_team,
        opponent_team=opp_team,
        match_date=body.match_date,
        location=body.location,
        status=status,
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


@app.get("/api/reports/match/{match_id}/bundle")
async def match_report_bundle(match_id: int):
    """Single payload for match / quarter / halftime / postgame reports (Postgres)."""
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    opp = Team.get_or_none(Team.id == match.opponent_team_id)
    stats = list(PlayerMatchStats.select().where(PlayerMatchStats.match == match_id))
    plays = list(
        PlayByPlay.select()
        .where(PlayByPlay.match == match_id)
        .order_by(PlayByPlay.quarter, PlayByPlay.game_time, PlayByPlay.id)
    )
    refs = list(
        RefereeCall.select()
        .where(RefereeCall.match == match_id)
        .order_by(RefereeCall.quarter, RefereeCall.game_time, RefereeCall.id)
    )
    poss = list(
        Possession.select()
        .where(Possession.match == match_id)
        .order_by(Possession.id)
    )
    return {
        "match": _match_to_dict(match),
        "opponent_name": opp.name if opp else "Opponent",
        "player_stats": [_stats_to_dict(s) for s in stats],
        "plays": [_play_to_dict(p) for p in plays],
        "referee_calls": [_ref_call_to_dict(r) for r in refs],
        "possessions": [_possession_to_dict(p) for p in poss],
    }


@app.get("/api/reports/season-summary")
async def season_summary(team_id: int = Query(1, ge=1)):
    """Roster + completed match count for UC Davis (or chosen team) season overview."""
    team = Team.get_or_none(Team.id == team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    players = list(Player.select().where((Player.team == team_id) & (Player.is_active == True)))
    completed = (
        Match.select()
        .where((Match.uc_davis_team == team_id) & (Match.status == "completed"))
        .count()
    )
    return {
        "team": _team_to_dict(team),
        "active_players": [_player_to_dict(p) for p in players],
        "completed_home_matches": completed,
    }


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

    compute_and_save_score(row)  
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

    compute_and_save_score(row)  
    update_player_career_stats(player)
    return _stats_to_dict(row)


# ---------------------------------------------------------------------------
# Heatmap (aggregated play coordinates from Postgres)
# ---------------------------------------------------------------------------


@app.get("/api/heatmap/points")
async def get_heatmap_points(
    match_id: Optional[int] = Query(None),
    kind: str = Query("shots", pattern="^(shots|goals)$"),
):
    """Points for heatmap: kind=shots includes shot+goal events; kind=goals goals only."""
    q = PlayByPlay.select(PlayByPlay.x_coordinate, PlayByPlay.y_coordinate).where(
        PlayByPlay.x_coordinate.is_null(False),
        PlayByPlay.y_coordinate.is_null(False),
    )
    if match_id is not None:
        q = q.where(PlayByPlay.match == match_id)
    if kind == "goals":
        q = q.where(PlayByPlay.event_type == "goal")
    else:
        q = q.where(PlayByPlay.event_type.in_(["shot", "goal"]))
    return [
        {"x": float(p.x_coordinate), "y": float(p.y_coordinate)}
        for p in q
    ]


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


@app.get("/api/matches/{match_id}/video-sync", response_model=List[MatchVideoSyncResponse])
async def get_match_video_sync(match_id: int):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    rows = MatchVideoSync.select().where(MatchVideoSync.match == match_id).order_by(MatchVideoSync.quarter)
    return [_video_sync_to_dict(v) for v in rows]


@app.put("/api/matches/{match_id}/video-sync", response_model=MatchVideoSyncResponse, dependencies=[Depends(verify_api_key)])
async def upsert_match_video_sync(match_id: int, body: MatchVideoSyncUpsert):
    match = Match.get_or_none(Match.id == match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    row = MatchVideoSync.get_or_none(
        (MatchVideoSync.match == match_id) & (MatchVideoSync.quarter == body.quarter)
    )
    if row:
        row.video_url = body.video_url
        row.video_offset_sec = body.video_offset_sec
        row.save()
    else:
        row = MatchVideoSync.create(
            match=match,
            quarter=body.quarter,
            video_url=body.video_url,
            video_offset_sec=body.video_offset_sec,
        )
    return _video_sync_to_dict(row)


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
