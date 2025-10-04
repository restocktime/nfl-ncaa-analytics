-- NFL Analytics Database Schema
-- SQLite database for fast, reliable NFL data storage
-- No more API rate limits or external dependencies!

-- Teams table - 32 NFL teams
CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY,
    espn_team_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    city TEXT NOT NULL,
    division TEXT NOT NULL, -- AFC East, NFC West, etc.
    conference TEXT NOT NULL, -- AFC, NFC
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Players table - All active NFL players
CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY,
    espn_player_id INTEGER UNIQUE,
    team_id INTEGER,
    name TEXT NOT NULL,
    position TEXT NOT NULL, -- QB, RB, WR, TE, etc.
    jersey_number INTEGER,
    height INTEGER, -- inches
    weight INTEGER, -- pounds
    age INTEGER,
    college TEXT,
    experience_years INTEGER,
    status TEXT DEFAULT 'active', -- active, injured, IR, suspended
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- Games table - All NFL games (schedule and results)
CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY,
    espn_game_id TEXT UNIQUE,
    week INTEGER NOT NULL,
    season INTEGER NOT NULL,
    season_type INTEGER DEFAULT 2, -- 1=preseason, 2=regular, 3=playoffs
    home_team_id INTEGER,
    away_team_id INTEGER,
    game_date TIMESTAMP NOT NULL,
    status TEXT NOT NULL, -- scheduled, live, final
    home_score INTEGER DEFAULT 0,
    away_score INTEGER DEFAULT 0,
    venue TEXT,
    weather_conditions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (home_team_id) REFERENCES teams(id),
    FOREIGN KEY (away_team_id) REFERENCES teams(id)
);

-- Player game statistics - Performance data for each game
CREATE TABLE IF NOT EXISTS player_stats (
    id INTEGER PRIMARY KEY,
    game_id INTEGER,
    player_id INTEGER,
    team_id INTEGER,
    
    -- Passing stats
    passing_attempts INTEGER DEFAULT 0,
    passing_completions INTEGER DEFAULT 0,
    passing_yards INTEGER DEFAULT 0,
    passing_touchdowns INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    
    -- Rushing stats  
    rushing_attempts INTEGER DEFAULT 0,
    rushing_yards INTEGER DEFAULT 0,
    rushing_touchdowns INTEGER DEFAULT 0,
    
    -- Receiving stats
    receptions INTEGER DEFAULT 0,
    receiving_yards INTEGER DEFAULT 0,
    receiving_touchdowns INTEGER DEFAULT 0,
    targets INTEGER DEFAULT 0,
    
    -- Other stats
    fumbles INTEGER DEFAULT 0,
    fumbles_lost INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (player_id) REFERENCES players(id),
    FOREIGN KEY (team_id) REFERENCES teams(id),
    UNIQUE(game_id, player_id)
);

-- Injury reports - Track player health status
CREATE TABLE IF NOT EXISTS injuries (
    id INTEGER PRIMARY KEY,
    player_id INTEGER,
    injury_type TEXT NOT NULL, -- knee, ankle, concussion, etc.
    injury_description TEXT,
    status TEXT NOT NULL, -- questionable, doubtful, out, IR
    injury_date DATE,
    estimated_return DATE,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Team statistics - Aggregate team performance
CREATE TABLE IF NOT EXISTS team_stats (
    id INTEGER PRIMARY KEY,
    team_id INTEGER,
    season INTEGER,
    week INTEGER,
    
    -- Offensive stats
    total_yards_offense INTEGER DEFAULT 0,
    passing_yards_offense INTEGER DEFAULT 0,
    rushing_yards_offense INTEGER DEFAULT 0,
    points_scored INTEGER DEFAULT 0,
    
    -- Defensive stats
    total_yards_defense INTEGER DEFAULT 0,
    passing_yards_defense INTEGER DEFAULT 0,
    rushing_yards_defense INTEGER DEFAULT 0,
    points_allowed INTEGER DEFAULT 0,
    
    -- Record
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    UNIQUE(team_id, season, week)
);

-- Betting lines - Odds and lines data (when available)
CREATE TABLE IF NOT EXISTS betting_lines (
    id INTEGER PRIMARY KEY,
    game_id INTEGER,
    bookmaker TEXT, -- draftkings, fanduel, etc.
    line_type TEXT NOT NULL, -- moneyline, spread, total
    
    -- Moneyline odds
    home_moneyline INTEGER, -- American odds format
    away_moneyline INTEGER,
    
    -- Spread
    spread_line REAL, -- home team spread
    spread_home_odds INTEGER,
    spread_away_odds INTEGER,
    
    -- Total (over/under)
    total_points REAL,
    over_odds INTEGER,
    under_odds INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id)
);

-- Sync log - Track data update history
CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY,
    sync_type TEXT NOT NULL, -- teams, players, games, stats, injuries
    sync_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    records_updated INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT 1,
    error_message TEXT,
    duration_ms INTEGER
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_games_week_season ON games(week, season);
CREATE INDEX IF NOT EXISTS idx_games_teams ON games(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_game_player ON player_stats(game_id, player_id);
CREATE INDEX IF NOT EXISTS idx_injuries_player_active ON injuries(player_id, is_active);
CREATE INDEX IF NOT EXISTS idx_betting_lines_game ON betting_lines(game_id);