import { MigrationInterface, QueryRunner } from 'typeorm';

export class FantasyFootballSchema1700000001000 implements MigrationInterface {
  name = 'FantasyFootballSchema1700000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Fantasy Users table
    await queryRunner.query(`
      CREATE TABLE fantasy_users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        preferences TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_fantasy_users_email (email)
      )
    `);

    // Fantasy Leagues table
    await queryRunner.query(`
      CREATE TABLE fantasy_leagues (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        platform ENUM('ESPN', 'Yahoo', 'Sleeper', 'NFL', 'Custom') NOT NULL,
        league_id VARCHAR(255) NOT NULL,
        settings TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES fantasy_users(id) ON DELETE CASCADE,
        INDEX idx_fantasy_leagues_user_id (user_id),
        INDEX idx_fantasy_leagues_active (is_active)
      )
    `);

    // Fantasy Rosters table
    await queryRunner.query(`
      CREATE TABLE fantasy_rosters (
        id VARCHAR(36) PRIMARY KEY,
        league_id VARCHAR(36) NOT NULL,
        week INT NOT NULL,
        season INT NOT NULL DEFAULT 2024,
        roster_data TEXT NOT NULL,
        projection DECIMAL(6,2) DEFAULT 0,
        actual_points DECIMAL(6,2) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (league_id) REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
        INDEX idx_fantasy_rosters_league_week (league_id, week),
        INDEX idx_fantasy_rosters_season (season),
        UNIQUE KEY unique_league_week (league_id, week, season)
      )
    `);

    // Player Projections table (fantasy-specific)
    await queryRunner.query(`
      CREATE TABLE fantasy_player_projections (
        id VARCHAR(36) PRIMARY KEY,
        player_id VARCHAR(36) NOT NULL,
        week INT NOT NULL,
        season INT NOT NULL DEFAULT 2024,
        projected_points DECIMAL(6,2) NOT NULL,
        confidence_lower DECIMAL(6,2) NOT NULL,
        confidence_upper DECIMAL(6,2) NOT NULL,
        ceiling DECIMAL(6,2) NOT NULL,
        floor DECIMAL(6,2) NOT NULL,
        matchup_rating DECIMAL(3,1) NOT NULL,
        injury_risk ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'LOW',
        weather_impact DECIMAL(4,3) DEFAULT 0,
        usage_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        INDEX idx_fantasy_projections_player_week (player_id, week),
        INDEX idx_fantasy_projections_season (season),
        INDEX idx_fantasy_projections_points (projected_points),
        UNIQUE KEY unique_player_week_season (player_id, week, season)
      )
    `);

    // Fantasy Decisions table (for tracking user decisions and outcomes)
    await queryRunner.query(`
      CREATE TABLE fantasy_decisions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        league_id VARCHAR(36) NOT NULL,
        week INT NOT NULL,
        season INT NOT NULL DEFAULT 2024,
        decision_type ENUM('LINEUP', 'WAIVER', 'TRADE', 'DROP') NOT NULL,
        decision_data TEXT NOT NULL,
        outcome TEXT DEFAULT NULL,
        success_score DECIMAL(4,2) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES fantasy_users(id) ON DELETE CASCADE,
        FOREIGN KEY (league_id) REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
        INDEX idx_fantasy_decisions_user_week (user_id, week),
        INDEX idx_fantasy_decisions_type (decision_type),
        INDEX idx_fantasy_decisions_season (season)
      )
    `);

    // Waiver Wire Targets table
    await queryRunner.query(`
      CREATE TABLE fantasy_waiver_targets (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        league_id VARCHAR(36) NOT NULL,
        player_id VARCHAR(36) NOT NULL,
        week INT NOT NULL,
        season INT NOT NULL DEFAULT 2024,
        priority INT NOT NULL,
        opportunity_score DECIMAL(4,1) NOT NULL,
        reasoning TEXT,
        faab_bid INT DEFAULT NULL,
        status ENUM('PENDING', 'CLAIMED', 'MISSED', 'CANCELLED') DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES fantasy_users(id) ON DELETE CASCADE,
        FOREIGN KEY (league_id) REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        INDEX idx_waiver_targets_user_week (user_id, week),
        INDEX idx_waiver_targets_priority (priority),
        INDEX idx_waiver_targets_status (status)
      )
    `);

    // Trade Proposals table
    await queryRunner.query(`
      CREATE TABLE fantasy_trade_proposals (
        id VARCHAR(36) PRIMARY KEY,
        league_id VARCHAR(36) NOT NULL,
        proposer_user_id VARCHAR(36) NOT NULL,
        target_user_id VARCHAR(36) NOT NULL,
        giving_players TEXT NOT NULL,
        receiving_players TEXT NOT NULL,
        status ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'EXPIRED') DEFAULT 'PENDING',
        fair_value DECIMAL(4,3) DEFAULT NULL,
        recommendation ENUM('ACCEPT', 'REJECT', 'COUNTER') DEFAULT NULL,
        analysis_data TEXT DEFAULT NULL,
        expires_at TIMESTAMP DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (league_id) REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
        FOREIGN KEY (proposer_user_id) REFERENCES fantasy_users(id) ON DELETE CASCADE,
        FOREIGN KEY (target_user_id) REFERENCES fantasy_users(id) ON DELETE CASCADE,
        INDEX idx_trade_proposals_league (league_id),
        INDEX idx_trade_proposals_status (status),
        INDEX idx_trade_proposals_users (proposer_user_id, target_user_id)
      )
    `);

    // Fantasy Analytics table (for tracking accuracy and performance)
    await queryRunner.query(`
      CREATE TABLE fantasy_analytics (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        league_id VARCHAR(36) NOT NULL,
        week INT NOT NULL,
        season INT NOT NULL DEFAULT 2024,
        projection_accuracy DECIMAL(4,3) DEFAULT NULL,
        lineup_optimality DECIMAL(4,3) DEFAULT NULL,
        waiver_success_rate DECIMAL(4,3) DEFAULT NULL,
        trade_success_rate DECIMAL(4,3) DEFAULT NULL,
        weekly_rank INT DEFAULT NULL,
        points_scored DECIMAL(6,2) DEFAULT NULL,
        points_possible DECIMAL(6,2) DEFAULT NULL,
        decisions_made INT DEFAULT 0,
        correct_decisions INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES fantasy_users(id) ON DELETE CASCADE,
        FOREIGN KEY (league_id) REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
        INDEX idx_fantasy_analytics_user_week (user_id, week),
        INDEX idx_fantasy_analytics_season (season),
        UNIQUE KEY unique_user_league_week (user_id, league_id, week, season)
      )
    `);

    // League Standings table
    await queryRunner.query(`
      CREATE TABLE fantasy_league_standings (
        id VARCHAR(36) PRIMARY KEY,
        league_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        week INT NOT NULL,
        season INT NOT NULL DEFAULT 2024,
        rank INT NOT NULL,
        wins INT DEFAULT 0,
        losses INT DEFAULT 0,
        ties INT DEFAULT 0,
        points_for DECIMAL(8,2) DEFAULT 0,
        points_against DECIMAL(8,2) DEFAULT 0,
        playoff_probability DECIMAL(4,3) DEFAULT NULL,
        strength_of_schedule DECIMAL(4,3) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (league_id) REFERENCES fantasy_leagues(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES fantasy_users(id) ON DELETE CASCADE,
        INDEX idx_standings_league_week (league_id, week),
        INDEX idx_standings_rank (rank),
        UNIQUE KEY unique_league_user_week (league_id, user_id, week, season)
      )
    `);

    // Player Ownership table (track ownership across leagues)
    await queryRunner.query(`
      CREATE TABLE fantasy_player_ownership (
        id VARCHAR(36) PRIMARY KEY,
        player_id VARCHAR(36) NOT NULL,
        week INT NOT NULL,
        season INT NOT NULL DEFAULT 2024,
        ownership_percentage DECIMAL(5,2) DEFAULT 0,
        add_percentage DECIMAL(5,2) DEFAULT 0,
        drop_percentage DECIMAL(5,2) DEFAULT 0,
        trade_volume INT DEFAULT 0,
        average_faab_bid DECIMAL(5,2) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        INDEX idx_ownership_player_week (player_id, week),
        INDEX idx_ownership_percentage (ownership_percentage),
        UNIQUE KEY unique_player_week_season (player_id, week, season)
      )
    `);

    // Matchup Analysis table
    await queryRunner.query(`
      CREATE TABLE fantasy_matchup_analysis (
        id VARCHAR(36) PRIMARY KEY,
        player_id VARCHAR(36) NOT NULL,
        opponent_team_id VARCHAR(36) NOT NULL,
        week INT NOT NULL,
        season INT NOT NULL DEFAULT 2024,
        overall_rating DECIMAL(3,1) NOT NULL,
        pass_defense_rating DECIMAL(3,1) DEFAULT NULL,
        rush_defense_rating DECIMAL(3,1) DEFAULT NULL,
        red_zone_defense_rating DECIMAL(3,1) DEFAULT NULL,
        home_away_impact DECIMAL(3,1) DEFAULT 0,
        pace_impact DECIMAL(3,1) DEFAULT 0,
        weather_impact DECIMAL(4,3) DEFAULT 0,
        game_script_impact DECIMAL(4,3) DEFAULT 0,
        reasoning TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
        FOREIGN KEY (opponent_team_id) REFERENCES teams(id) ON DELETE CASCADE,
        INDEX idx_matchup_player_week (player_id, week),
        INDEX idx_matchup_rating (overall_rating),
        UNIQUE KEY unique_player_opponent_week (player_id, opponent_team_id, week, season)
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to handle foreign key constraints
    await queryRunner.query('DROP TABLE IF EXISTS fantasy_matchup_analysis');
    await queryRunner.query('DROP TABLE IF EXISTS fantasy_player_ownership');
    await queryRunner.query('DROP TABLE IF EXISTS fantasy_league_standings');
    await queryRunner.query('DROP TABLE IF EXISTS fantasy_analytics');
    await queryRunner.query('DROP TABLE IF EXISTS fantasy_trade_proposals');
    await queryRunner.query('DROP TABLE IF EXISTS fantasy_waiver_targets');
    await queryRunner.query('DROP TABLE IF EXISTS fantasy_decisions');
    await queryRunner.query('DROP TABLE IF EXISTS fantasy_player_projections');
    await queryRunner.query('DROP TABLE IF EXISTS fantasy_rosters');
    await queryRunner.query('DROP TABLE IF EXISTS fantasy_leagues');
    await queryRunner.query('DROP TABLE IF EXISTS fantasy_users');
  }
}