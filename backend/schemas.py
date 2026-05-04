from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Team
# ---------------------------------------------------------------------------

class TeamCreate(BaseModel):
    name: str
    short_name: str
    is_uc_davis: bool = False


class TeamResponse(BaseModel):
    id: int
    name: str
    short_name: str
    is_uc_davis: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Player
# ---------------------------------------------------------------------------

class PlayerCreate(BaseModel):
    team_id: int
    name: str
    jersey_number: int
    position: Optional[str] = None
    is_active: bool = True


class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    jersey_number: Optional[int] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None


class PlayerResponse(BaseModel):
    id: int
    team_id: int
    name: str
    jersey_number: int
    position: Optional[str]
    is_active: bool
    total_goals: int
    total_assists: int
    total_shots: int
    total_steals: int
    total_blocks: int
    total_turnovers: int
    total_exclusions: int
    total_penalties: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Match
# ---------------------------------------------------------------------------

class MatchCreate(BaseModel):
    uc_davis_team_id: int
    opponent_team_id: int
    match_date: datetime
    location: Optional[str] = None


class MatchUpdate(BaseModel):
    status: Optional[str] = None
    uc_davis_score: Optional[int] = None
    opponent_score: Optional[int] = None
    current_quarter: Optional[int] = None
    game_time: Optional[str] = None
    referee_name: Optional[str] = None


class MatchResponse(BaseModel):
    id: int
    uc_davis_team_id: int
    opponent_team_id: int
    match_date: datetime
    location: Optional[str]
    uc_davis_score: int
    opponent_score: int
    status: str
    current_quarter: int
    game_time: Optional[str]
    referee_name: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# PlayerMatchStats
# ---------------------------------------------------------------------------

class StatsDelta(BaseModel):
    player_id: int
    shots: Optional[int] = None
    goals: Optional[int] = None
    assists: Optional[int] = None
    steals: Optional[int] = None
    blocks: Optional[int] = None
    turnovers: Optional[int] = None
    penalties: Optional[int] = None
    exclusions: Optional[int] = None
    rebounds: Optional[int] = None
    tipped_passes: Optional[int] = None
    sprints: Optional[int] = None
    hustle: Optional[int] = None
    draws: Optional[int] = None
    time_in_pool: Optional[int] = None


class StatsOverwrite(BaseModel):
    player_id: int
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


class StatsResponse(BaseModel):
    id: int
    match_id: int
    player_id: int
    shots: int
    goals: int
    assists: int
    steals: int
    blocks: int
    turnovers: int
    penalties: int
    exclusions: int
    rebounds: int
    tipped_passes: int
    sprints: int
    hustle: int
    draws: int
    time_in_pool: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# PlayByPlay
# ---------------------------------------------------------------------------

class PlayCreate(BaseModel):
    quarter: int
    game_time: int
    event_type: str
    player_id: Optional[int] = None
    team_id: Optional[int] = None
    x_coordinate: Optional[float] = None
    y_coordinate: Optional[float] = None
    formation: Optional[str] = None
    call_type: Optional[str] = None
    player_name: Optional[str] = None
    player_in_id: Optional[int] = None
    player_out_id: Optional[int] = None
    stat_name: Optional[str] = None
    value: Optional[int] = None
    notes: Optional[str] = None


class PlayResponse(BaseModel):
    id: int
    match_id: int
    quarter: int
    game_time: int
    event_type: str
    player_id: Optional[int]
    team_id: Optional[int]
    x_coordinate: Optional[float]
    y_coordinate: Optional[float]
    formation: Optional[str]
    call_type: Optional[str]
    player_name: Optional[str]
    player_in_id: Optional[int]
    player_out_id: Optional[int]
    stat_name: Optional[str]
    value: Optional[int]
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# RefereeCall
# ---------------------------------------------------------------------------

class RefereeCallCreate(BaseModel):
    quarter: int
    game_time: int
    call_type: str
    player_id: Optional[int] = None
    player_name: Optional[str] = None
    team_id: Optional[int] = None


class RefereeCallResponse(BaseModel):
    id: int
    match_id: int
    quarter: int
    game_time: int
    call_type: str
    player_id: Optional[int]
    player_name: Optional[str]
    team_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Possession
# ---------------------------------------------------------------------------

class PossessionCreate(BaseModel):
    team_id: int
    quarter: int
    start_time: int
    outcome: Optional[str] = None
    is_power_play: bool = False


class PossessionUpdate(BaseModel):
    end_time: Optional[int] = None
    outcome: Optional[str] = None


class PossessionResponse(BaseModel):
    id: int
    match_id: int
    team_id: int
    quarter: int
    start_time: int
    end_time: Optional[int]
    outcome: Optional[str]
    is_power_play: bool

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# PlayerNote
# ---------------------------------------------------------------------------

class NoteCreate(BaseModel):
    player_id: int
    note: str
    quarter: Optional[int] = None
    game_time: Optional[int] = None


class NoteResponse(BaseModel):
    id: int
    match_id: Optional[int]
    player_id: int
    note: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Match Video Sync
# ---------------------------------------------------------------------------

class MatchVideoSyncUpsert(BaseModel):
    quarter: int = 1
    video_url: str
    video_offset_sec: int = 0


class MatchVideoSyncResponse(BaseModel):
    id: int
    match_id: int
    quarter: int
    video_url: str
    video_offset_sec: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
