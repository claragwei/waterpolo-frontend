"""
Database models using Peewee ORM for UC Davis Water Polo Analytics
"""
from peewee import *
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
database_url = os.getenv('DATABASE_URL', 'postgresql://localhost/waterpolo')
db = PostgresqlDatabase(database_url)


class BaseModel(Model):
    """Base model with common fields"""
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)
    
    class Meta:
        database = db
    
    def save(self, *args, **kwargs):
        self.updated_at = datetime.now()
        return super().save(*args, **kwargs)


class Team(BaseModel):
    """Team model"""
    id = AutoField()
    name = CharField(max_length=100)
    short_name = CharField(max_length=50, null=True)
    is_uc_davis = BooleanField(default=False)
    
    class Meta:
        table_name = 'teams'


class Player(BaseModel):
    """Player model with all stats"""
    id = AutoField()
    team = ForeignKeyField(Team, backref='players', on_delete='CASCADE')
    name = CharField(max_length=100)
    jersey_number = IntegerField()
    position = CharField(max_length=50, null=True)  # e.g., "Center", "Driver", "Goalie"
    is_active = BooleanField(default=True)
    
    # Career stats (aggregated)
    total_goals = IntegerField(default=0)
    total_assists = IntegerField(default=0)
    total_shots = IntegerField(default=0)
    total_steals = IntegerField(default=0)
    total_blocks = IntegerField(default=0)
    total_turnovers = IntegerField(default=0)
    total_exclusions = IntegerField(default=0)
    total_penalties = IntegerField(default=0)
    
    class Meta:
        table_name = 'players'
        indexes = (
            (('team', 'jersey_number'), True),  # Unique jersey number per team
        )


class Match(BaseModel):
    """Match/Game model"""
    id = AutoField()
    uc_davis_team = ForeignKeyField(Team, backref='home_matches')
    opponent_team = ForeignKeyField(Team, backref='away_matches')
    match_date = DateTimeField()
    location = CharField(max_length=200, null=True)
    
    # Final scores
    uc_davis_score = IntegerField(default=0)
    opponent_score = IntegerField(default=0)
    
    # Match status
    status = CharField(max_length=20, default='scheduled')  # scheduled, in_progress, completed
    current_quarter = IntegerField(default=1)
    game_time = IntegerField(default=0)  # seconds elapsed
    
    # Referee
    referee_name = CharField(max_length=100, null=True)
    
    class Meta:
        table_name = 'matches'


class Quarter(BaseModel):
    """Quarter stats for a match"""
    id = AutoField()
    match = ForeignKeyField(Match, backref='quarters', on_delete='CASCADE')
    quarter_number = IntegerField()
    uc_davis_score = IntegerField(default=0)
    opponent_score = IntegerField(default=0)
    duration = IntegerField(default=0)  # seconds
    
    class Meta:
        table_name = 'quarters'
        indexes = (
            (('match', 'quarter_number'), True),
        )


class PlayerMatchStats(BaseModel):
    """Individual player statistics for a specific match"""
    id = AutoField()
    match = ForeignKeyField(Match, backref='player_stats', on_delete='CASCADE')
    player = ForeignKeyField(Player, backref='match_stats', on_delete='CASCADE')
    
    # Game stats
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
    
    # Playing time
    time_in_pool = IntegerField(default=0)  # seconds
    
    class Meta:
        table_name = 'player_match_stats'
        indexes = (
            (('match', 'player'), True),
        )


class PlayByPlay(BaseModel):
    """Play-by-play events during a match"""
    id = AutoField()
    match = ForeignKeyField(Match, backref='plays', on_delete='CASCADE')
    player = ForeignKeyField(Player, backref='plays', null=True, on_delete='CASCADE')
    quarter = IntegerField()
    game_time = IntegerField()  # seconds
    event_type = CharField(max_length=50)  # 'goal', 'assist', 'shot', 'steal', etc.
    description = TextField(null=True)
    
    # Heatmap data for shots/goals
    x_coordinate = FloatField(null=True)
    y_coordinate = FloatField(null=True)
    formation = CharField(max_length=10, null=True)  # '4-2' or '3-3'
    
    class Meta:
        table_name = 'play_by_play'


class RefereeCall(BaseModel):
    """Referee calls during a match"""
    id = AutoField()
    match = ForeignKeyField(Match, backref='referee_calls', on_delete='CASCADE')
    player = ForeignKeyField(Player, backref='referee_calls', null=True, on_delete='CASCADE')
    quarter = IntegerField()
    game_time = IntegerField()
    call_type = CharField(max_length=50)  # 'yellow-card', 'red-card', 'ejection', etc.
    team = CharField(max_length=20)  # 'ucDavis' or 'opponent'
    
    class Meta:
        table_name = 'referee_calls'


class Possession(BaseModel):
    """Possession tracking for a match"""
    id = AutoField()
    match = ForeignKeyField(Match, backref='possessions', on_delete='CASCADE')
    team = CharField(max_length=20)  # 'ucDavis' or 'opponent'
    start_time = IntegerField()  # game time in seconds
    end_time = IntegerField(null=True)
    duration = IntegerField(null=True)
    quarter = IntegerField()
    event = CharField(max_length=50)  # 'Goal', 'Turnover', 'Steal', etc.
    
    class Meta:
        table_name = 'possessions'


class PlayerNote(BaseModel):
    """Notes about player performance during a match"""
    id = AutoField()
    match = ForeignKeyField(Match, backref='player_notes', on_delete='CASCADE')
    player = ForeignKeyField(Player, backref='notes', on_delete='CASCADE')
    quarter = IntegerField()
    game_time = IntegerField()
    note = TextField()
    
    class Meta:
        table_name = 'player_notes'


# Create tables
def create_tables():
    """Create all database tables"""
    with db:
        db.create_tables([
            Team,
            Player,
            Match,
            Quarter,
            PlayerMatchStats,
            PlayByPlay,
            RefereeCall,
            Possession,
            PlayerNote,
        ])


# Seed initial data
def seed_initial_data():
    """Seed UC Davis team and initial players"""
    with db.atomic():
        # Create UC Davis team
        uc_davis, _ = Team.get_or_create(
            name='UC Davis Aggies',
            defaults={'short_name': 'UC Davis', 'is_uc_davis': True}
        )
        
        # Create initial players if they don't exist
        players_data = [
            {'name': 'Alex Martinez', 'jersey_number': 1},
            {'name': 'Jake Thompson', 'jersey_number': 2},
            {'name': 'Ryan Chen', 'jersey_number': 3},
            {'name': 'Marcus Wilson', 'jersey_number': 4},
            {'name': 'David Kim', 'jersey_number': 5},
            {'name': 'Brandon Lee', 'jersey_number': 6},
            {'name': 'Chris Anderson', 'jersey_number': 7},
            {'name': 'Tyler Johnson', 'jersey_number': 8},
            {'name': 'Noah Parker', 'jersey_number': 9},
            {'name': 'Ethan Rodriguez', 'jersey_number': 10},
        ]
        
        for player_data in players_data:
            Player.get_or_create(
                team=uc_davis,
                jersey_number=player_data['jersey_number'],
                defaults={'name': player_data['name'], 'is_active': True}
            )


if __name__ == '__main__':
    create_tables()
    seed_initial_data()
    print("Database tables created and seeded successfully!")
