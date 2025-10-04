-- NFL Analytics Database Schema for PostgreSQL
-- Initialization script for Docker container

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    abbreviation VARCHAR(10) NOT NULL,
    displayName VARCHAR(255),
    color VARCHAR(7),
    alternateColor VARCHAR(7),
    logo TEXT,
    conference VARCHAR(10),
    division VARCHAR(20),
    city VARCHAR(100),
    stadium VARCHAR(255),
    founded INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(10) NOT NULL,
    team VARCHAR(255) NOT NULL,
    jersey_number INTEGER,
    height VARCHAR(10),
    weight INTEGER,
    age INTEGER,
    experience_years INTEGER DEFAULT 0,
    college VARCHAR(255),
    salary BIGINT,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create injuries table
CREATE TABLE IF NOT EXISTS injuries (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(255) NOT NULL,
    team VARCHAR(255) NOT NULL,
    position VARCHAR(10),
    injury_type VARCHAR(255),
    body_part VARCHAR(100),
    status VARCHAR(50) NOT NULL, -- Healthy, Questionable, Doubtful, Out, IR
    date_occurred DATE,
    expected_return DATE,
    severity VARCHAR(20), -- Minor, Moderate, Major
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_team ON players(team);
CREATE INDEX IF NOT EXISTS idx_players_position ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_name ON players(name);
CREATE INDEX IF NOT EXISTS idx_injuries_team ON injuries(team);
CREATE INDEX IF NOT EXISTS idx_injuries_status ON injuries(status);

-- Insert sample teams (you'll migrate real data later)
INSERT INTO teams (name, abbreviation, displayName, conference, division) VALUES 
('Kansas City Chiefs', 'KC', 'Kansas City Chiefs', 'AFC', 'West'),
('Buffalo Bills', 'BUF', 'Buffalo Bills', 'AFC', 'East'),
('Las Vegas Raiders', 'LV', 'Las Vegas Raiders', 'AFC', 'West'),
('Indianapolis Colts', 'IND', 'Indianapolis Colts', 'AFC', 'South')
ON CONFLICT (name) DO NOTHING;

-- Sample players (you'll replace with real data)
INSERT INTO players (name, position, team, experience_years) VALUES 
('Patrick Mahomes', 'QB', 'Kansas City Chiefs', 8),
('Josh Allen', 'QB', 'Buffalo Bills', 7),
('Geno Smith', 'QB', 'Las Vegas Raiders', 12),
('Anthony Richardson', 'QB', 'Indianapolis Colts', 2)
ON CONFLICT DO NOTHING;

COMMIT;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'NFL Analytics database initialized successfully!';
END $$;