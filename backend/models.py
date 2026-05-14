from peewee import *
from datetime import datetime
from database import db


class BaseModel(Model):
    class Meta:
        database = db


class Team(BaseModel):
    name = CharField()
    short_name = CharField()
    is_uc_davis = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.now)


class Player(BaseModel):
    team = ForeignKeyField(Team, backref='players')
    name = CharField()
    jersey_number = IntegerField()
    position = CharField(null=True)        # 'field' | 'goalie'
    is_active = BooleanField(default=True)
    photo_url = CharField(null=True, max_length=512)
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
    score = FloatField(default=0.0)

    class Meta:
        indexes = ((('match', 'player'), True),)  # unique constraint


class PlayByPlay(BaseModel):
    match = ForeignKeyField(Match, backref='plays')
    quarter = IntegerField()
    game_time = IntegerField()               # seconds elapsed
    event_type = CharField()
    player = ForeignKeyField(Player, null=True, backref='plays')
    team = ForeignKeyField(Team, null=True, backref='plays')
    x_coordinate = FloatField(null=True)
    y_coordinate = FloatField(null=True)
    formation = CharField(null=True)
    call_type = CharField(null=True)
    player_name = CharField(null=True)
    player_in_id = IntegerField(null=True)
    player_out_id = IntegerField(null=True)
    stat_name = CharField(null=True)
    value = IntegerField(null=True)
    notes = TextField(null=True)
    created_at = DateTimeField(default=datetime.now)


class RefereeCall(BaseModel):
    match = ForeignKeyField(Match, backref='referee_calls')
    quarter = IntegerField()
    game_time = IntegerField()
    call_type = CharField()
    player = ForeignKeyField(Player, null=True, backref='referee_calls')
    player_name = CharField(null=True)
    team = ForeignKeyField(Team, null=True, backref='referee_calls')
    created_at = DateTimeField(default=datetime.now)


class Possession(BaseModel):
    match = ForeignKeyField(Match, backref='possessions')
    team = ForeignKeyField(Team, backref='possessions')
    quarter = IntegerField()
    start_time = IntegerField()
    end_time = IntegerField(null=True)
    outcome = CharField(null=True)           # 'goal' | 'turnover' | 'steal'
    is_power_play = BooleanField(default=False)


class PlayerNote(BaseModel):
    match = ForeignKeyField(Match, null=True, backref='player_notes')
    player = ForeignKeyField(Player, backref='notes')
    note = TextField()
    created_at = DateTimeField(default=datetime.now)


class MatchVideoSync(BaseModel):
    match = ForeignKeyField(Match, backref='video_sync')
    quarter = IntegerField(default=1)
    video_url = TextField()
    video_offset_sec = IntegerField(default=0)
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)

    def save(self, *args, **kwargs):
        self.updated_at = datetime.now()
        return super().save(*args, **kwargs)

    class Meta:
        indexes = ((('match', 'quarter'), True),)


def create_tables():
    with db:
        db.create_tables(
            [Team, Player, Match, PlayerMatchStats,
             PlayByPlay, RefereeCall, Possession, PlayerNote, MatchVideoSync],
            safe=True,
        )
