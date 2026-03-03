"""
FastAPI application with routes for UC Davis Water Polo Analytics
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
import os
from dotenv import load_dotenv

from models import (
    db, Team, Player, Match, PlayerMatchStats, PlayByPlay,
    RefereeCall, Possession, PlayerNote, create_tables
)
from schemas import (
    TeamCreate, TeamResponse,
    PlayerCreate, PlayerUpdate, PlayerResponse, PlayerWithTeam,
    MatchCreate, MatchUpdate, MatchResponse, MatchWithTeams,
    PlayerMatchStatsCreate, PlayerMatchStatsUpdate, PlayerMatchStatsResponse,
    PlayerMatchStatsWithPlayer,
    PlayByPlayCreate, PlayByPlayResponse,
    RefereeCallCreate, RefereeCallResponse,
    PossessionCreate, PossessionUpdate, PossessionResponse,
    PlayerNoteCreate, PlayerNoteResponse,
    PlayerAverageStats, TeamStats
)

load_dotenv()

app = FastAPI(
    title="UC Davis Water Polo API",
    description="API for tracking water polo statistics and analytics",
    version="1.0.0"
)

# CORS configuration
origins = os.getenv('CORS_ORIGINS', 'http://localhost:5173').split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Database connection management
@app.on_event("startup")
async def startup():
    db.connect()
    create_tables()


@app.on_event("shutdown")
async def shutdown():
    if not db.is_closed():
        db.close()


# Health check
@app.get("/")
async def root():
    return {"message": "UC Davis Water Polo API", "status": "running"}


# ==================== TEAM ENDPOINTS ====================

@app.get("/api/teams", response_model=List[TeamResponse])
async def get_teams():
    """Get all teams"""
    teams = Team.select()
    return list(teams)


@app.get("/api/teams/{team_id}", response_model=TeamResponse)
async def get_team(team_id: int):
    """Get a specific team"""
    try:
        team = Team.get_by_id(team_id)
        return team
    except Team.DoesNotExist:
        raise HTTPException(status_code=404, detail="Team not found")


@app.post("/api/teams", response_model=TeamResponse, status_code=201)
async def create_team(team: TeamCreate):
    """Create a new team"""
    new_team = Team.create(**team.model_dump())
    return new_team


# ==================== PLAYER ENDPOINTS ====================

@app.get("/api/players", response_model=List[PlayerWithTeam])
async def get_players(
    team_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None
):
    """Get all players with optional filters"""
    query = Player.select().join(Team)
    
    if team_id:
        query = query.where(Player.team == team_id)
    if is_active is not None:
        query = query.where(Player.is_active == is_active)
    if search:
        query = query.where(Player.name.contains(search))
    
    players = []
    for player in query:
        player_dict = {
            'id': player.id,
            'team_id': player.team.id,
            'name': player.name,
            'jersey_number': player.jersey_number,
            'position': player.position,
            'is_active': player.is_active,
            'total_goals': player.total_goals,
            'total_assists': player.total_assists,
            'total_shots': player.total_shots,
            'total_steals': player.total_steals,
            'total_blocks': player.total_blocks,
            'total_turnovers': player.total_turnovers,
            'total_exclusions': player.total_exclusions,
            'total_penalties': player.total_penalties,
            'created_at': player.created_at,
            'team': {
                'id': player.team.id,
                'name': player.team.name,
                'short_name': player.team.short_name,
                'is_uc_davis': player.team.is_uc_davis,
                'created_at': player.team.created_at,
            }
        }
        players.append(player_dict)
    
    return players


@app.get("/api/players/{player_id}", response_model=PlayerWithTeam)
async def get_player(player_id: int):
    """Get a specific player"""
    try:
        player = Player.select().join(Team).where(Player.id == player_id).get()
        return {
            'id': player.id,
            'team_id': player.team.id,
            'name': player.name,
            'jersey_number': player.jersey_number,
            'position': player.position,
            'is_active': player.is_active,
            'total_goals': player.total_goals,
            'total_assists': player.total_assists,
            'total_shots': player.total_shots,
            'total_steals': player.total_steals,
            'total_blocks': player.total_blocks,
            'total_turnovers': player.total_turnovers,
            'total_exclusions': player.total_exclusions,
            'total_penalties': player.total_penalties,
            'created_at': player.created_at,
            'team': {
                'id': player.team.id,
                'name': player.team.name,
                'short_name': player.team.short_name,
                'is_uc_davis': player.team.is_uc_davis,
                'created_at': player.team.created_at,
            }
        }
    except Player.DoesNotExist:
        raise HTTPException(status_code=404, detail="Player not found")


@app.post("/api/players", response_model=PlayerResponse, status_code=201)
async def create_player(player: PlayerCreate):
    """Create a new player"""
    try:
        team = Team.get_by_id(player.team_id)
        new_player = Player.create(**player.model_dump())
        return new_player
    except Team.DoesNotExist:
        raise HTTPException(status_code=404, detail="Team not found")


@app.patch("/api/players/{player_id}", response_model=PlayerResponse)
async def update_player(player_id: int, player_update: PlayerUpdate):
    """Update a player"""
    try:
        player = Player.get_by_id(player_id)
        update_data = player_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(player, field, value)
        player.save()
        return player
    except Player.DoesNotExist:
        raise HTTPException(status_code=404, detail="Player not found")


@app.delete("/api/players/{player_id}", status_code=204)
async def delete_player(player_id: int):
    """Delete a player"""
    try:
        player = Player.get_by_id(player_id)
        player.delete_instance()
    except Player.DoesNotExist:
        raise HTTPException(status_code=404, detail="Player not found")


# ==================== MATCH ENDPOINTS ====================

@app.get("/api/matches", response_model=List[MatchWithTeams])
async def get_matches(
    status: Optional[str] = None,
    limit: int = Query(default=50, le=100)
):
    """Get all matches"""
    query = Match.select().join(Team)
    
    if status:
        query = query.where(Match.status == status)
    
    query = query.order_by(Match.match_date.desc()).limit(limit)
    
    matches = []
    for match in query:
        match_dict = {
            'id': match.id,
            'uc_davis_team_id': match.uc_davis_team.id,
            'opponent_team_id': match.opponent_team.id,
            'match_date': match.match_date,
            'location': match.location,
            'uc_davis_score': match.uc_davis_score,
            'opponent_score': match.opponent_score,
            'status': match.status,
            'current_quarter': match.current_quarter,
            'game_time': match.game_time,
            'referee_name': match.referee_name,
            'created_at': match.created_at,
            'uc_davis_team': {
                'id': match.uc_davis_team.id,
                'name': match.uc_davis_team.name,
                'short_name': match.uc_davis_team.short_name,
                'is_uc_davis': match.uc_davis_team.is_uc_davis,
                'created_at': match.uc_davis_team.created_at,
            },
            'opponent_team': {
                'id': match.opponent_team.id,
                'name': match.opponent_team.name,
                'short_name': match.opponent_team.short_name,
                'is_uc_davis': match.opponent_team.is_uc_davis,
                'created_at': match.opponent_team.created_at,
            }
        }
        matches.append(match_dict)
    
    return matches


@app.get("/api/matches/{match_id}", response_model=MatchWithTeams)
async def get_match(match_id: int):
    """Get a specific match"""
    try:
        match = Match.get_by_id(match_id)
        return {
            'id': match.id,
            'uc_davis_team_id': match.uc_davis_team.id,
            'opponent_team_id': match.opponent_team.id,
            'match_date': match.match_date,
            'location': match.location,
            'uc_davis_score': match.uc_davis_score,
            'opponent_score': match.opponent_score,
            'status': match.status,
            'current_quarter': match.current_quarter,
            'game_time': match.game_time,
            'referee_name': match.referee_name,
            'created_at': match.created_at,
            'uc_davis_team': {
                'id': match.uc_davis_team.id,
                'name': match.uc_davis_team.name,
                'short_name': match.uc_davis_team.short_name,
                'is_uc_davis': match.uc_davis_team.is_uc_davis,
                'created_at': match.uc_davis_team.created_at,
            },
            'opponent_team': {
                'id': match.opponent_team.id,
                'name': match.opponent_team.name,
                'short_name': match.opponent_team.short_name,
                'is_uc_davis': match.opponent_team.is_uc_davis,
                'created_at': match.opponent_team.created_at,
            }
        }
    except Match.DoesNotExist:
        raise HTTPException(status_code=404, detail="Match not found")


@app.post("/api/matches", response_model=MatchResponse, status_code=201)
async def create_match(match: MatchCreate):
    """Create a new match"""
    try:
        Team.get_by_id(match.uc_davis_team_id)
        Team.get_by_id(match.opponent_team_id)
        new_match = Match.create(**match.model_dump())
        return new_match
    except Team.DoesNotExist:
        raise HTTPException(status_code=404, detail="Team not found")


@app.patch("/api/matches/{match_id}", response_model=MatchResponse)
async def update_match(match_id: int, match_update: MatchUpdate):
    """Update a match"""
    try:
        match = Match.get_by_id(match_id)
        update_data = match_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(match, field, value)
        match.save()
        return match
    except Match.DoesNotExist:
        raise HTTPException(status_code=404, detail="Match not found")


# ==================== PLAYER MATCH STATS ENDPOINTS ====================

@app.get("/api/matches/{match_id}/stats", response_model=List[PlayerMatchStatsWithPlayer])
async def get_match_stats(match_id: int):
    """Get all player stats for a match"""
    try:
        Match.get_by_id(match_id)
        stats = PlayerMatchStats.select().join(Player).where(PlayerMatchStats.match == match_id)
        
        result = []
        for stat in stats:
            stat_dict = {
                'id': stat.id,
                'match_id': stat.match.id,
                'player_id': stat.player.id,
                'shots': stat.shots,
                'goals': stat.goals,
                'assists': stat.assists,
                'steals': stat.steals,
                'blocks': stat.blocks,
                'turnovers': stat.turnovers,
                'penalties': stat.penalties,
                'exclusions': stat.exclusions,
                'rebounds': stat.rebounds,
                'tipped_passes': stat.tipped_passes,
                'sprints': stat.sprints,
                'hustle': stat.hustle,
                'draws': stat.draws,
                'time_in_pool': stat.time_in_pool,
                'player': {
                    'id': stat.player.id,
                    'team_id': stat.player.team.id,
                    'name': stat.player.name,
                    'jersey_number': stat.player.jersey_number,
                    'position': stat.player.position,
                    'is_active': stat.player.is_active,
                    'total_goals': stat.player.total_goals,
                    'total_assists': stat.player.total_assists,
                    'total_shots': stat.player.total_shots,
                    'total_steals': stat.player.total_steals,
                    'total_blocks': stat.player.total_blocks,
                    'total_turnovers': stat.player.total_turnovers,
                    'total_exclusions': stat.player.total_exclusions,
                    'total_penalties': stat.player.total_penalties,
                    'created_at': stat.player.created_at,
                }
            }
            result.append(stat_dict)
        
        return result
    except Match.DoesNotExist:
        raise HTTPException(status_code=404, detail="Match not found")


@app.post("/api/matches/{match_id}/stats", response_model=PlayerMatchStatsResponse, status_code=201)
async def create_match_stats(match_id: int, stats: PlayerMatchStatsCreate):
    """Create or update player stats for a match"""
    try:
        match = Match.get_by_id(match_id)
        player = Player.get_by_id(stats.player_id)
        
        # Check if stats already exist
        existing_stats = PlayerMatchStats.get_or_none(
            (PlayerMatchStats.match == match_id) & 
            (PlayerMatchStats.player == stats.player_id)
        )
        
        if existing_stats:
            # Update existing stats
            for field, value in stats.model_dump(exclude={'match_id', 'player_id'}).items():
                setattr(existing_stats, field, value)
            existing_stats.save()
            
            # Update player career stats
            update_player_career_stats(player)
            
            return existing_stats
        else:
            # Create new stats
            new_stats = PlayerMatchStats.create(
                match=match,
                player=player,
                **stats.model_dump(exclude={'match_id', 'player_id'})
            )
            
            # Update player career stats
            update_player_career_stats(player)
            
            return new_stats
    except (Match.DoesNotExist, Player.DoesNotExist):
        raise HTTPException(status_code=404, detail="Match or Player not found")


def update_player_career_stats(player: Player):
    """Aggregate and update player career statistics"""
    stats = PlayerMatchStats.select().where(PlayerMatchStats.player == player)
    
    player.total_goals = sum(s.goals for s in stats)
    player.total_assists = sum(s.assists for s in stats)
    player.total_shots = sum(s.shots for s in stats)
    player.total_steals = sum(s.steals for s in stats)
    player.total_blocks = sum(s.blocks for s in stats)
    player.total_turnovers = sum(s.turnovers for s in stats)
    player.total_exclusions = sum(s.exclusions for s in stats)
    player.total_penalties = sum(s.penalties for s in stats)
    player.save()


# ==================== PLAY BY PLAY ENDPOINTS ====================

@app.get("/api/matches/{match_id}/plays", response_model=List[PlayByPlayResponse])
async def get_match_plays(match_id: int):
    """Get all plays for a match"""
    try:
        Match.get_by_id(match_id)
        plays = PlayByPlay.select().where(PlayByPlay.match == match_id).order_by(PlayByPlay.game_time)
        return list(plays)
    except Match.DoesNotExist:
        raise HTTPException(status_code=404, detail="Match not found")


@app.post("/api/matches/{match_id}/plays", response_model=PlayByPlayResponse, status_code=201)
async def create_play(match_id: int, play: PlayByPlayCreate):
    """Record a play"""
    try:
        match = Match.get_by_id(match_id)
        new_play = PlayByPlay.create(match=match, **play.model_dump(exclude={'match_id'}))
        return new_play
    except Match.DoesNotExist:
        raise HTTPException(status_code=404, detail="Match not found")


# ==================== STATISTICS & ANALYTICS ENDPOINTS ====================

@app.get("/api/players/{player_id}/averages", response_model=PlayerAverageStats)
async def get_player_averages(player_id: int):
    """Get average statistics for a player"""
    try:
        player = Player.get_by_id(player_id)
        stats = PlayerMatchStats.select().where(PlayerMatchStats.player == player_id)
        
        games_played = stats.count()
        if games_played == 0:
            raise HTTPException(status_code=404, detail="No stats found for this player")
        
        total_goals = sum(s.goals for s in stats)
        total_assists = sum(s.assists for s in stats)
        total_shots = sum(s.shots for s in stats)
        total_steals = sum(s.steals for s in stats)
        total_blocks = sum(s.blocks for s in stats)
        total_turnovers = sum(s.turnovers for s in stats)
        
        shot_accuracy = (total_goals / total_shots * 100) if total_shots > 0 else 0
        
        return {
            'player_id': player.id,
            'player_name': player.name,
            'jersey_number': player.jersey_number,
            'games_played': games_played,
            'avg_goals': total_goals / games_played,
            'avg_assists': total_assists / games_played,
            'avg_shots': total_shots / games_played,
            'avg_steals': total_steals / games_played,
            'avg_blocks': total_blocks / games_played,
            'avg_turnovers': total_turnovers / games_played,
            'shot_accuracy': round(shot_accuracy, 2)
        }
    except Player.DoesNotExist:
        raise HTTPException(status_code=404, detail="Player not found")


@app.get("/api/teams/{team_id}/stats", response_model=TeamStats)
async def get_team_stats(team_id: int):
    """Get team statistics"""
    try:
        team = Team.get_by_id(team_id)
        
        # Get all matches for this team
        if team.is_uc_davis:
            matches = Match.select().where(Match.uc_davis_team == team_id)
        else:
            matches = Match.select().where(Match.opponent_team == team_id)
        
        wins = 0
        losses = 0
        ties = 0
        
        for match in matches:
            if match.status == 'completed':
                if team.is_uc_davis:
                    if match.uc_davis_score > match.opponent_score:
                        wins += 1
                    elif match.uc_davis_score < match.opponent_score:
                        losses += 1
                    else:
                        ties += 1
                else:
                    if match.opponent_score > match.uc_davis_score:
                        wins += 1
                    elif match.opponent_score < match.uc_davis_score:
                        losses += 1
                    else:
                        ties += 1
        
        # Get player stats
        players = Player.select().where(Player.team == team_id)
        total_goals = sum(p.total_goals for p in players)
        total_shots = sum(p.total_shots for p in players)
        total_assists = sum(p.total_assists for p in players)
        total_steals = sum(p.total_steals for p in players)
        
        shot_accuracy = (total_goals / total_shots * 100) if total_shots > 0 else 0
        
        return {
            'team_id': team.id,
            'team_name': team.name,
            'total_goals': total_goals,
            'total_shots': total_shots,
            'total_assists': total_assists,
            'total_steals': total_steals,
            'shot_accuracy': round(shot_accuracy, 2),
            'wins': wins,
            'losses': losses,
            'ties': ties
        }
    except Team.DoesNotExist:
        raise HTTPException(status_code=404, detail="Team not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv('API_HOST', '0.0.0.0'),
        port=int(os.getenv('API_PORT', 8000)),
        reload=os.getenv('DEBUG', 'False').lower() == 'true'
    )
