import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable TimescaleDB extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;`);
    
    // Create teams table
    await queryRunner.query(`
      CREATE TABLE "teams" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "abbreviation" character varying,
        "conference" character varying NOT NULL,
        "division" character varying,
        "city" character varying,
        "state" character varying,
        "primary_color" character varying,
        "secondary_color" character varying,
        "logo_url" character varying,
        "head_coach" character varying,
        "offensive_coordinator" character varying,
        "defensive_coordinator" character varying,
        "coaching_staff" jsonb,
        "home_venue" character varying,
        "venue_capacity" integer,
        "founded_year" integer,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_teams_name" UNIQUE ("name"),
        CONSTRAINT "PK_teams" PRIMARY KEY ("id")
      )
    `);

    // Create games table
    await queryRunner.query(`
      CREATE TABLE "games" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "home_team_id" uuid NOT NULL,
        "away_team_id" uuid NOT NULL,
        "scheduled_time" TIMESTAMP WITH TIME ZONE NOT NULL,
        "status" character varying NOT NULL DEFAULT 'scheduled',
        "venue" character varying,
        "city" character varying,
        "state" character varying,
        "home_score" integer NOT NULL DEFAULT 0,
        "away_score" integer NOT NULL DEFAULT 0,
        "quarter" integer,
        "time_remaining" character varying,
        "weather_conditions" jsonb,
        "betting_lines" jsonb,
        "officials" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_games" PRIMARY KEY ("id")
      )
    `);

    // Create players table
    await queryRunner.query(`
      CREATE TABLE "players" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL,
        "jersey_number" integer,
        "position" character varying NOT NULL,
        "height" character varying,
        "weight" integer,
        "age" integer,
        "experience" integer,
        "college" character varying,
        "team_id" uuid NOT NULL,
        "injury_status" character varying NOT NULL DEFAULT 'healthy',
        "injury_description" character varying,
        "injury_date" TIMESTAMP WITH TIME ZONE,
        "expected_return" TIMESTAMP WITH TIME ZONE,
        "depth_chart_position" integer,
        "is_starter" boolean NOT NULL DEFAULT false,
        "contract_details" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_players" PRIMARY KEY ("id")
      )
    `);

    // Create game_states table (time-series optimized)
    await queryRunner.query(`
      CREATE TABLE "game_states" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "game_id" uuid NOT NULL,
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
        "home_score" integer NOT NULL,
        "away_score" integer NOT NULL,
        "quarter" integer,
        "time_remaining" character varying,
        "possession_team_id" uuid,
        "field_position" integer,
        "down" integer,
        "yards_to_go" integer,
        "red_zone" boolean NOT NULL DEFAULT false,
        "goal_to_go" boolean NOT NULL DEFAULT false,
        "momentum_score" numeric(5,3),
        "home_timeouts" integer NOT NULL DEFAULT 3,
        "away_timeouts" integer NOT NULL DEFAULT 3,
        "play_clock" integer,
        "game_clock" character varying,
        "weather_conditions" jsonb,
        "last_play" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_game_states" PRIMARY KEY ("id")
      )
    `);

    // Create game_probabilities table (time-series optimized)
    await queryRunner.query(`
      CREATE TABLE "game_probabilities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "game_id" uuid NOT NULL,
        "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
        "home_win_probability" numeric(5,4) NOT NULL,
        "away_win_probability" numeric(5,4) NOT NULL,
        "spread_probability" numeric(5,4),
        "spread_value" numeric(4,1),
        "over_probability" numeric(5,4),
        "under_probability" numeric(5,4),
        "total_points" numeric(4,1),
        "confidence_interval_lower" numeric(5,4),
        "confidence_interval_upper" numeric(5,4),
        "model_version" character varying,
        "simulation_iterations" integer,
        "key_factors" jsonb,
        "player_props" jsonb,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_game_probabilities" PRIMARY KEY ("id")
      )
    `);

    // Create team_statistics table
    await queryRunner.query(`
      CREATE TABLE "team_statistics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "team_id" uuid NOT NULL,
        "season" integer NOT NULL,
        "week" integer,
        "opponent_id" character varying,
        "is_home" boolean NOT NULL DEFAULT false,
        "points_scored" integer NOT NULL DEFAULT 0,
        "total_yards" integer NOT NULL DEFAULT 0,
        "passing_yards" integer NOT NULL DEFAULT 0,
        "rushing_yards" integer NOT NULL DEFAULT 0,
        "first_downs" integer NOT NULL DEFAULT 0,
        "third_down_conversions" integer NOT NULL DEFAULT 0,
        "third_down_attempts" integer NOT NULL DEFAULT 0,
        "red_zone_conversions" integer NOT NULL DEFAULT 0,
        "red_zone_attempts" integer NOT NULL DEFAULT 0,
        "turnovers" integer NOT NULL DEFAULT 0,
        "penalties" integer NOT NULL DEFAULT 0,
        "penalty_yards" integer NOT NULL DEFAULT 0,
        "time_of_possession" character varying,
        "points_allowed" integer NOT NULL DEFAULT 0,
        "yards_allowed" integer NOT NULL DEFAULT 0,
        "passing_yards_allowed" integer NOT NULL DEFAULT 0,
        "rushing_yards_allowed" integer NOT NULL DEFAULT 0,
        "sacks" integer NOT NULL DEFAULT 0,
        "interceptions" integer NOT NULL DEFAULT 0,
        "fumbles_recovered" integer NOT NULL DEFAULT 0,
        "tackles_for_loss" integer NOT NULL DEFAULT 0,
        "offensive_efficiency" numeric(5,3),
        "defensive_efficiency" numeric(5,3),
        "expected_points_added" numeric(6,3),
        "success_rate" numeric(5,3),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_team_statistics" PRIMARY KEY ("id")
      )
    `);

    // Create player_statistics table
    await queryRunner.query(`
      CREATE TABLE "player_statistics" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "player_id" uuid NOT NULL,
        "season" integer NOT NULL,
        "week" integer,
        "opponent_id" character varying,
        "is_home" boolean NOT NULL DEFAULT false,
        "games_played" integer NOT NULL DEFAULT 0,
        "games_started" integer NOT NULL DEFAULT 0,
        "passing_attempts" integer NOT NULL DEFAULT 0,
        "passing_completions" integer NOT NULL DEFAULT 0,
        "passing_yards" integer NOT NULL DEFAULT 0,
        "passing_touchdowns" integer NOT NULL DEFAULT 0,
        "interceptions_thrown" integer NOT NULL DEFAULT 0,
        "sacks_taken" integer NOT NULL DEFAULT 0,
        "qb_rating" numeric(5,2),
        "rushing_attempts" integer NOT NULL DEFAULT 0,
        "rushing_yards" integer NOT NULL DEFAULT 0,
        "rushing_touchdowns" integer NOT NULL DEFAULT 0,
        "fumbles" integer NOT NULL DEFAULT 0,
        "receptions" integer NOT NULL DEFAULT 0,
        "receiving_yards" integer NOT NULL DEFAULT 0,
        "receiving_touchdowns" integer NOT NULL DEFAULT 0,
        "targets" integer NOT NULL DEFAULT 0,
        "drops" integer NOT NULL DEFAULT 0,
        "tackles" integer NOT NULL DEFAULT 0,
        "assists" integer NOT NULL DEFAULT 0,
        "sacks" integer NOT NULL DEFAULT 0,
        "tackles_for_loss" integer NOT NULL DEFAULT 0,
        "interceptions" integer NOT NULL DEFAULT 0,
        "pass_deflections" integer NOT NULL DEFAULT 0,
        "forced_fumbles" integer NOT NULL DEFAULT 0,
        "fumble_recoveries" integer NOT NULL DEFAULT 0,
        "field_goals_made" integer NOT NULL DEFAULT 0,
        "field_goals_attempted" integer NOT NULL DEFAULT 0,
        "extra_points_made" integer NOT NULL DEFAULT 0,
        "extra_points_attempted" integer NOT NULL DEFAULT 0,
        "punts" integer NOT NULL DEFAULT 0,
        "punt_yards" integer NOT NULL DEFAULT 0,
        "punt_returns" integer NOT NULL DEFAULT 0,
        "punt_return_yards" integer NOT NULL DEFAULT 0,
        "kickoff_returns" integer NOT NULL DEFAULT 0,
        "kickoff_return_yards" integer NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_player_statistics" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "games" ADD CONSTRAINT "FK_games_home_team" 
      FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "games" ADD CONSTRAINT "FK_games_away_team" 
      FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "players" ADD CONSTRAINT "FK_players_team" 
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "game_states" ADD CONSTRAINT "FK_game_states_game" 
      FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "game_states" ADD CONSTRAINT "FK_game_states_possession_team" 
      FOREIGN KEY ("possession_team_id") REFERENCES "teams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "game_probabilities" ADD CONSTRAINT "FK_game_probabilities_game" 
      FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "team_statistics" ADD CONSTRAINT "FK_team_statistics_team" 
      FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "player_statistics" ADD CONSTRAINT "FK_player_statistics_player" 
      FOREIGN KEY ("player_id") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Create indexes for performance
    await queryRunner.query(`CREATE INDEX "IDX_teams_name" ON "teams" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_teams_conference" ON "teams" ("conference")`);
    await queryRunner.query(`CREATE INDEX "IDX_games_scheduled_time" ON "games" ("scheduled_time")`);
    await queryRunner.query(`CREATE INDEX "IDX_games_status" ON "games" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_games_teams" ON "games" ("home_team_id", "away_team_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_players_team" ON "players" ("team_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_players_position" ON "players" ("position")`);
    await queryRunner.query(`CREATE INDEX "IDX_players_injury_status" ON "players" ("injury_status")`);
    await queryRunner.query(`CREATE INDEX "IDX_game_states_game_timestamp" ON "game_states" ("game_id", "timestamp")`);
    await queryRunner.query(`CREATE INDEX "IDX_game_states_timestamp" ON "game_states" ("timestamp")`);
    await queryRunner.query(`CREATE INDEX "IDX_game_probabilities_game_timestamp" ON "game_probabilities" ("game_id", "timestamp")`);
    await queryRunner.query(`CREATE INDEX "IDX_game_probabilities_timestamp" ON "game_probabilities" ("timestamp")`);
    await queryRunner.query(`CREATE INDEX "IDX_team_statistics_team_season_week" ON "team_statistics" ("team_id", "season", "week")`);
    await queryRunner.query(`CREATE INDEX "IDX_team_statistics_season" ON "team_statistics" ("season")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_statistics_player_season_week" ON "player_statistics" ("player_id", "season", "week")`);
    await queryRunner.query(`CREATE INDEX "IDX_player_statistics_season" ON "player_statistics" ("season")`);

    // Convert time-series tables to hypertables for TimescaleDB optimization
    await queryRunner.query(`SELECT create_hypertable('game_states', 'timestamp');`);
    await queryRunner.query(`SELECT create_hypertable('game_probabilities', 'timestamp');`);

    // Set up data retention policies for time-series data
    await queryRunner.query(`SELECT add_retention_policy('game_states', INTERVAL '2 years');`);
    await queryRunner.query(`SELECT add_retention_policy('game_probabilities', INTERVAL '2 years');`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order due to foreign key constraints
    await queryRunner.query(`DROP TABLE "player_statistics"`);
    await queryRunner.query(`DROP TABLE "team_statistics"`);
    await queryRunner.query(`DROP TABLE "game_probabilities"`);
    await queryRunner.query(`DROP TABLE "game_states"`);
    await queryRunner.query(`DROP TABLE "players"`);
    await queryRunner.query(`DROP TABLE "games"`);
    await queryRunner.query(`DROP TABLE "teams"`);
  }
}