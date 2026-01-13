from peewee import *
from playhouse.postgres_ext import PostgresqlDatabase, JSONField
from datetime import datetime
from typing import List, Dict

# Database connection
db = PostgresqlDatabase(
    'waterpolo_analytics',
    user='your_username',
    password='your_password',
    host='localhost',
    port=5432
)

class BaseModel(Model):
    """Base model with common fields and database connection"""
    created_at = DateTimeField(default=datetime.now)
    updated_at = DateTimeField(default=datetime.now)
    
    class Meta:
        database = db
    
    def save(self, *args, **kwargs):
        self.updated_at = datetime.now()
        return super(BaseModel, self).save(*args, **kwargs)


class Team(BaseModel):
    """Represents a water polo team"""
    name = CharField(unique=True)
    coach_name = CharField(null=True)
    division = CharField(null=True)
    season = CharField(null=True)
    
    class Meta:
        indexes = (
            (('name', 'season'), True),  # Unique constraint
        )


class Player(BaseModel):
    """Represents a water polo player"""
    team = ForeignKeyField(Team, backref='players', on_delete='CASCADE')
    first_name = CharField()
    last_name = CharField()
    jersey_number = IntegerField()
    position = CharField()  # e.g., 'Center', 'Wing', 'Driver', 'Goalie', 'Flat'
    is_active = BooleanField(default=True)
    
    class Meta:
        indexes = (
            (('team', 'jersey_number'), True),  # Unique per team
        )


class Match(BaseModel):
    """Represents a water polo match"""
    home_team = ForeignKeyField(Team, backref='home_matches')
    away_team = ForeignKeyField(Team, backref='away_matches')
    match_date = DateTimeField()
    location = CharField(null=True)
    home_score = IntegerField(default=0)
    away_score = IntegerField(default=0)
    quarter_scores = JSONField(null=True)  # e.g., {'q1': [2, 1], 'q2': [1, 1]}
    match_type = CharField()  # 'Regular', 'Playoff', 'Tournament', 'Scrimmage'
    status = CharField(default='Scheduled')  # 'Scheduled', 'Live', 'Final'
    notes = TextField(null=True)


class TeamMatchStats(BaseModel):
    """Detailed statistics for a team in a specific match (Counters & Possession)"""
    team = ForeignKeyField(Team, backref='match_stats')
    match = ForeignKeyField(Match, backref='team_stats', on_delete='CASCADE')

    # Situational Opportunities (Counts from frontend TeamStats)
    fco = IntegerField(default=0)  # Front Court Offense
    fcd = IntegerField(default=0)  # Front Court Defense
    cao = IntegerField(default=0)  # Counter Attack Offense
    cad = IntegerField(default=0)  # Counter Attack Defense
    ag = IntegerField(default=0)   # After Goal
    agd = IntegerField(default=0)  # After Goal Defense
    
    # Special Situations
    six_on_five_opportunities = IntegerField(default=0)   # Power Play (6v5)
    five_on_six_opportunities = IntegerField(default=0)   # Man Down (5v6)
    seven_on_six_opportunities = IntegerField(default=0)  # 7v6
    six_on_seven_opportunities = IntegerField(default=0)  # 6v7
    
    # Possession
    total_possession_time_seconds = FloatField(default=0.0)
    
    class Meta:
        indexes = (
            (('team', 'match'), True),
        )


class PlayerMatchStats(BaseModel):
    """Statistics for a player in a specific match"""
    player = ForeignKeyField(Player, backref='match_stats')
    match = ForeignKeyField(Match, backref='player_stats', on_delete='CASCADE')
    
    # Offensive stats
    shots_attempted = IntegerField(default=0)
    goals = IntegerField(default=0)
    assists = IntegerField(default=0)
    turnovers = IntegerField(default=0)
    
    # Defensive stats
    steals = IntegerField(default=0)
    blocks = IntegerField(default=0)
    rebounds = IntegerField(default=0)
    tipped_passes = IntegerField(default=0)
    
    # Physical/Hustle
    sprints_won = IntegerField(default=0)
    sprints_attempted = IntegerField(default=0)
    hustles = IntegerField(default=0)
    
    # Fouls & Exclusions
    fouls_committed = IntegerField(default=0)      # Ordinary fouls
    exclusions_committed = IntegerField(default=0) # Kickouts (20s)
    exclusions_drawn = IntegerField(default=0)     # 'Draws' in frontend
    penalty_fouls_committed = IntegerField(default=0)
    
    # Special situations
    power_play_goals = IntegerField(default=0)
    penalty_shots_made = IntegerField(default=0)
    penalty_shots_attempted = IntegerField(default=0) # 'Penalties' in frontend
    
    # Goalie-specific stats
    saves = IntegerField(null=True)
    goals_allowed = IntegerField(null=True)
    
    # Time
    minutes_played = DecimalField(max_digits=5, decimal_places=2, default=0)
    
    class Meta:
        indexes = (
            (('player', 'match'), True),  # One stat entry per player per match
        )
    
    @property
    def shot_percentage(self):
        if self.shots_attempted == 0:
            return 0
        return (self.goals / self.shots_attempted) * 100


class Possession(BaseModel):
    """Tracks a single continuous possession for advanced flow analytics"""
    match = ForeignKeyField(Match, backref='possessions', on_delete='CASCADE')
    team = ForeignKeyField(Team, backref='possessions')
    quarter = IntegerField()
    start_time_seconds = FloatField() # Game clock time or elapsed time
    end_time_seconds = FloatField(null=True)
    duration_seconds = FloatField(default=0.0)
    
    # How did the possession start/end?
    start_reason = CharField(null=True) # 'Sprint', 'Steal', 'Goal', 'Turnover'
    end_reason = CharField(null=True)   # 'Goal', 'Turnover', 'Steal', 'Shot Clock', 'Period End'
    notes = TextField(null=True)


class Play(BaseModel):
    """Represents a strategic play or tactic definition"""
    name = CharField()
    description = TextField(null=True)
    play_type = CharField()  # 'Offensive', 'Defensive', 'Special Teams'
    formation = CharField(null=True)  # e.g., '3-3', '4-2', 'Press'
    team = ForeignKeyField(Team, backref='plays', null=True)  # null if generic play
    diagram_url = CharField(null=True)
    
    class Meta:
        indexes = (
            (('name', 'team'), False),
        )


class MatchPlay(BaseModel):
    """Tracks play calls during a match"""
    match = ForeignKeyField(Match, backref='plays_used', on_delete='CASCADE')
    play = ForeignKeyField(Play, backref='match_usage')
    team = ForeignKeyField(Team, backref='match_plays')
    quarter = IntegerField()
    timestamp_seconds = FloatField(null=True)
    is_successful = BooleanField(default=False)
    notes = TextField(null=True)


class Action(BaseModel):
    """High-granularity event log for ML/Analytics (Shots, Goals, Fouls, etc.)"""
    match = ForeignKeyField(Match, backref='actions', on_delete='CASCADE')
    team = ForeignKeyField(Team, backref='actions')
    player = ForeignKeyField(Player, backref='actions', null=True)
    possession = ForeignKeyField(Possession, backref='actions', null=True)
    
    action_type = CharField()  # 'Shot', 'Goal', 'Pass', 'Steal', 'Block', 'Exclusion', 'Sprint'
    quarter = IntegerField()
    game_clock_seconds = FloatField(null=True) # Time remaining or elapsed
    timestamp = DateTimeField(default=datetime.now)
    
    # Location data for Heatmaps
    zone = CharField(null=True) # e.g., 'Wing Left', 'Point', 'Hole', 'Flat Right'
    coordinate_x = FloatField(null=True) # X coordinate (0-100)
    coordinate_y = FloatField(null=True) # Y coordinate (0-100)
    
    result = CharField(null=True)  # 'Made', 'Missed', 'Blocked', 'Saved'
    
    # Related entities
    assist_player = ForeignKeyField(Player, backref='assists_given', null=True)
    related_play = ForeignKeyField(Play, backref='actions', null=True)
    
    # Context
    is_power_play = BooleanField(default=False)
    is_counter_attack = BooleanField(default=False)
    notes = TextField(null=True)


class OpponentProfile(BaseModel):
    """Scouting report and analytics for opponent teams"""
    team = ForeignKeyField(Team, backref='opponent_profiles', unique=True)
    
    # Aggregated Stats
    avg_goals_per_game = DecimalField(max_digits=5, decimal_places=2, null=True)
    avg_goals_allowed = DecimalField(max_digits=5, decimal_places=2, null=True)
    
    # Strategic Tendencies (Stored as JSON for flexibility)
    formations_frequency = JSONField(null=True) 
    play_calls_frequency = JSONField(null=True)
    shot_chart_hotspots = JSONField(null=True) # e.g., {'left_wing': 0.3, 'hole': 0.5}
    
    # Qualitative
    strengths = TextField(null=True)
    weaknesses = TextField(null=True)
    key_players = JSONField(null=True)  # List of player IDs to watch
    
    last_analysis_date = DateTimeField(null=True)


# Helper functions for common queries
class QueryHelpers:
    """Helper class for common database queries"""
    
    @staticmethod
    def get_player_season_averages(player: Player, season: str = None):
        """Calculate season averages for a player"""
        query = (PlayerMatchStats
                .select()
                .join(Match)
                .where(PlayerMatchStats.player == player))
        
        # Note: This implies Team has season field or we filter matches by date range
        if season:
            # Simplified assumption: filter by Match year or join Team if Team stores season
             query = query.where(Match.match_date.year == int(season.split('-')[0]))

        stats = list(query)
        if not stats:
            return None
        
        total_games = len(stats)
        return {
            'games_played': total_games,
            'avg_goals': sum(s.goals for s in stats) / total_games,
            'avg_shots': sum(s.shots_attempted for s in stats) / total_games,
            'avg_assists': sum(s.assists for s in stats) / total_games,
            'avg_steals': sum(s.steals for s in stats) / total_games,
            'avg_blocks': sum(s.blocks for s in stats) / total_games,
            'shot_percentage': (sum(s.goals for s in stats) / 
                              sum(s.shots_attempted for s in stats) * 100 
                              if sum(s.shots_attempted for s in stats) > 0 else 0),
        }
    
    @staticmethod
    def get_team_stats_summary(team: Team, match: Match):
        """Get summary of team stats for a specific match"""
        try:
            return TeamMatchStats.get(team=team, match=match)
        except TeamMatchStats.DoesNotExist:
            return None


def initialize_database():
    """Create all tables in the database"""
    db.connect()
    db.create_tables([
        Team, Player, Match, TeamMatchStats, PlayerMatchStats, 
        Possession, Play, MatchPlay, Action, OpponentProfile
    ])
    print("Database tables created successfully!")


def close_database():
    """Close database connection"""
    if not db.is_closed():
        db.close()


if __name__ == '__main__':
    # Initialize database
    initialize_database()
    
    # Example usage code would go here
    print("ORM initialized and ready.")
