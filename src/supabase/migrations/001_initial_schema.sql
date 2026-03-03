-- UC Davis Water Polo Analytics Database Schema
-- Migration: 001_initial_schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    coach_name VARCHAR(255),
    division VARCHAR(100),
    season VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, season)
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    jersey_number INTEGER NOT NULL,
    position VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, jersey_number)
);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_team_id UUID NOT NULL REFERENCES teams(id),
    away_team_id UUID NOT NULL REFERENCES teams(id),
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(255),
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    quarter_scores JSONB,
    match_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Scheduled',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Match Stats table
CREATE TABLE team_match_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    fco INTEGER DEFAULT 0,
    fcd INTEGER DEFAULT 0,
    cao INTEGER DEFAULT 0,
    cad INTEGER DEFAULT 0,
    ag INTEGER DEFAULT 0,
    agd INTEGER DEFAULT 0,
    six_on_five_opportunities INTEGER DEFAULT 0,
    five_on_six_opportunities INTEGER DEFAULT 0,
    seven_on_six_opportunities INTEGER DEFAULT 0,
    six_on_seven_opportunities INTEGER DEFAULT 0,
    total_possession_time_seconds DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, match_id)
);

-- Player Match Stats table
CREATE TABLE player_match_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID NOT NULL REFERENCES players(id),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    shots_attempted INTEGER DEFAULT 0,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    steals INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    rebounds INTEGER DEFAULT 0,
    tipped_passes INTEGER DEFAULT 0,
    sprints_won INTEGER DEFAULT 0,
    sprints_attempted INTEGER DEFAULT 0,
    hustles INTEGER DEFAULT 0,
    fouls_committed INTEGER DEFAULT 0,
    exclusions_committed INTEGER DEFAULT 0,
    exclusions_drawn INTEGER DEFAULT 0,
    penalty_fouls_committed INTEGER DEFAULT 0,
    power_play_goals INTEGER DEFAULT 0,
    penalty_shots_made INTEGER DEFAULT 0,
    penalty_shots_attempted INTEGER DEFAULT 0,
    saves INTEGER,
    goals_allowed INTEGER,
    minutes_played DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, match_id)
);

-- Possessions table
CREATE TABLE possessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id),
    quarter INTEGER NOT NULL,
    start_time_seconds DECIMAL(10, 2) NOT NULL,
    end_time_seconds DECIMAL(10, 2),
    duration_seconds DECIMAL(10, 2) DEFAULT 0,
    start_reason VARCHAR(100),
    end_reason VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plays table
CREATE TABLE plays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    play_type VARCHAR(50) NOT NULL,
    formation VARCHAR(50),
    team_id UUID REFERENCES teams(id),
    diagram_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Plays table
CREATE TABLE match_plays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    play_id UUID NOT NULL REFERENCES plays(id),
    team_id UUID NOT NULL REFERENCES teams(id),
    quarter INTEGER NOT NULL,
    timestamp_seconds DECIMAL(10, 2),
    is_successful BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Actions table (for heatmaps and detailed analytics)
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id),
    player_id UUID REFERENCES players(id),
    possession_id UUID REFERENCES possessions(id),
    action_type VARCHAR(50) NOT NULL,
    quarter INTEGER NOT NULL,
    game_clock_seconds DECIMAL(10, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    zone VARCHAR(50),
    coordinate_x DECIMAL(5, 2),
    coordinate_y DECIMAL(5, 2),
    result VARCHAR(50),
    assist_player_id UUID REFERENCES players(id),
    related_play_id UUID REFERENCES plays(id),
    is_power_play BOOLEAN DEFAULT false,
    is_counter_attack BOOLEAN DEFAULT false,
    formation VARCHAR(10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opponent Profiles table
CREATE TABLE opponent_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL UNIQUE REFERENCES teams(id),
    avg_goals_per_game DECIMAL(5, 2),
    avg_goals_allowed DECIMAL(5, 2),
    formations_frequency JSONB,
    play_calls_frequency JSONB,
    shot_chart_hotspots JSONB,
    strengths TEXT,
    weaknesses TEXT,
    key_players JSONB,
    last_analysis_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_team_match_stats_match ON team_match_stats(match_id);
CREATE INDEX idx_player_match_stats_match ON player_match_stats(match_id);
CREATE INDEX idx_player_match_stats_player ON player_match_stats(player_id);
CREATE INDEX idx_actions_match ON actions(match_id);
CREATE INDEX idx_actions_player ON actions(player_id);
CREATE INDEX idx_actions_type ON actions(action_type);
CREATE INDEX idx_possessions_match ON possessions(match_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_match_stats_updated_at BEFORE UPDATE ON team_match_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_match_stats_updated_at BEFORE UPDATE ON player_match_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_possessions_updated_at BEFORE UPDATE ON possessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plays_updated_at BEFORE UPDATE ON plays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_match_plays_updated_at BEFORE UPDATE ON match_plays FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_actions_updated_at BEFORE UPDATE ON actions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_opponent_profiles_updated_at BEFORE UPDATE ON opponent_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE teams IS 'Water polo teams';
COMMENT ON TABLE players IS 'Individual players on teams';
COMMENT ON TABLE matches IS 'Water polo matches/games';
COMMENT ON TABLE team_match_stats IS 'Aggregate team statistics for a specific match';
COMMENT ON TABLE player_match_stats IS 'Individual player statistics for a specific match';
COMMENT ON TABLE possessions IS 'Possession tracking for flow analytics';
COMMENT ON TABLE actions IS 'Granular event log for heatmaps and ML analytics';
