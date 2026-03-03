"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Team schemas
class TeamBase(BaseModel):
    name: str
    short_name: Optional[str] = None
    is_uc_davis: bool = False


class TeamCreate(TeamBase):
    pass


class TeamResponse(TeamBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Player schemas
class PlayerBase(BaseModel):
    name: str
    jersey_number: int
    position: Optional[str] = None
    is_active: bool = True


class PlayerCreate(PlayerBase):
    team_id: int


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    jersey_number: Optional[int] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None


class PlayerResponse(PlayerBase):
    id: int
    team_id: int
    total_goals: int
    total_assists: int
    total_shots: int
    total_steals: int
    total_blocks: int
    total_turnovers: int
    total_exclusions: int
    total_penalties: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class PlayerWithTeam(PlayerResponse):
    team: TeamResponse


# Match schemas
class MatchBase(BaseModel):
    match_date: datetime
    location: Optional[str] = None
    referee_name: Optional[str] = None


class MatchCreate(MatchBase):
    uc_davis_team_id: int
    opponent_team_id: int


class MatchUpdate(BaseModel):
    uc_davis_score: Optional[int] = None
    opponent_score: Optional[int] = None
    status: Optional[str] = None
    current_quarter: Optional[int] = None
    game_time: Optional[int] = None
    referee_name: Optional[str] = None


class MatchResponse(MatchBase):
    id: int
    uc_davis_team_id: int
    opponent_team_id: int
    uc_davis_score: int
    opponent_score: int
    status: str
    current_quarter: int
    game_time: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class MatchWithTeams(MatchResponse):
    uc_davis_team: TeamResponse
    opponent_team: TeamResponse


# Player Match Stats schemas
class PlayerMatchStatsBase(BaseModel):
    shots: int = 0
    goals: int = 0
    assists: int = 0
    steals: int = 0
    blocks: int = 0
    turnovers: int = 0
    penalties: int = 0
    exclusions: int = 0
    rebounds: int = 0
    tipped_passes: int = 0
    sprints: int = 0
    hustle: int = 0
    draws: int = 0
    time_in_pool: int = 0


class PlayerMatchStatsCreate(PlayerMatchStatsBase):
    match_id: int
    player_id: int


class PlayerMatchStatsUpdate(PlayerMatchStatsBase):
    pass


class PlayerMatchStatsResponse(PlayerMatchStatsBase):
    id: int
    match_id: int
    player_id: int
    
    class Config:
        from_attributes = True


class PlayerMatchStatsWithPlayer(PlayerMatchStatsResponse):
    player: PlayerResponse


# Play by Play schemas
class PlayByPlayBase(BaseModel):
    quarter: int
    game_time: int
    event_type: str
    description: Optional[str] = None
    x_coordinate: Optional[float] = None
    y_coordinate: Optional[float] = None
    formation: Optional[str] = None


class PlayByPlayCreate(PlayByPlayBase):
    match_id: int
    player_id: Optional[int] = None


class PlayByPlayResponse(PlayByPlayBase):
    id: int
    match_id: int
    player_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Referee Call schemas
class RefereeCallBase(BaseModel):
    quarter: int
    game_time: int
    call_type: str
    team: str


class RefereeCallCreate(RefereeCallBase):
    match_id: int
    player_id: Optional[int] = None


class RefereeCallResponse(RefereeCallBase):
    id: int
    match_id: int
    player_id: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Possession schemas
class PossessionBase(BaseModel):
    team: str
    start_time: int
    quarter: int
    event: str


class PossessionCreate(PossessionBase):
    match_id: int
    end_time: Optional[int] = None
    duration: Optional[int] = None


class PossessionUpdate(BaseModel):
    end_time: Optional[int] = None
    duration: Optional[int] = None
    event: Optional[str] = None


class PossessionResponse(PossessionBase):
    id: int
    match_id: int
    end_time: Optional[int]
    duration: Optional[int]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Player Note schemas
class PlayerNoteBase(BaseModel):
    quarter: int
    game_time: int
    note: str


class PlayerNoteCreate(PlayerNoteBase):
    match_id: int
    player_id: int


class PlayerNoteResponse(PlayerNoteBase):
    id: int
    match_id: int
    player_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Statistics aggregation schemas
class PlayerAverageStats(BaseModel):
    player_id: int
    player_name: str
    jersey_number: int
    games_played: int
    avg_goals: float
    avg_assists: float
    avg_shots: float
    avg_steals: float
    avg_blocks: float
    avg_turnovers: float
    shot_accuracy: float


class TeamStats(BaseModel):
    team_id: int
    team_name: str
    total_goals: int
    total_shots: int
    total_assists: int
    total_steals: int
    shot_accuracy: float
    wins: int
    losses: int
    ties: int
