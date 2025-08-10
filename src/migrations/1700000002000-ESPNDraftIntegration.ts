import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

/**
 * ESPN Draft Integration Database Migration
 * 
 * Creates tables for ESPN account connections, league data, draft history,
 * and expert content caching to support the ESPN draft integration feature.
 */
export class ESPNDraftIntegration1700000002000 implements MigrationInterface {
  name = 'ESPNDraftIntegration1700000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ESPN Account Connections table
    await queryRunner.createTable(
      new Table({
        name: 'espn_connections',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'espn_user_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'access_token',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'refresh_token',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'display_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'profile_image_url',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'connected_at',
            type: 'timestamp',
            default: 'NOW()',
          },
          {
            name: 'last_sync_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            name: 'IDX_espn_connections_user_id',
            columnNames: ['user_id'],
            isUnique: true,
          },
          {
            name: 'IDX_espn_connections_espn_user_id',
            columnNames: ['espn_user_id'],
            isUnique: true,
          },
        ],
      }),
      true
    );

    // ESPN Leagues table
    await queryRunner.createTable(
      new Table({
        name: 'espn_leagues',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'connection_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'espn_league_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'league_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'league_size',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'scoring_format',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'draft_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'season_year',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'last_sync_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['connection_id'],
            referencedTableName: 'espn_connections',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            name: 'IDX_espn_leagues_connection_league',
            columnNames: ['connection_id', 'espn_league_id'],
            isUnique: true,
          },
          {
            name: 'IDX_espn_leagues_season_year',
            columnNames: ['season_year'],
          },
        ],
      }),
      true
    );

    // Draft History table
    await queryRunner.createTable(
      new Table({
        name: 'draft_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'league_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'draft_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'draft_position',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'total_picks',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'draft_grade',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'picks',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'expert_comparison',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['league_id'],
            referencedTableName: 'espn_leagues',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
        indices: [
          {
            name: 'IDX_draft_history_user_id',
            columnNames: ['user_id'],
          },
          {
            name: 'IDX_draft_history_draft_date',
            columnNames: ['draft_date'],
          },
          {
            name: 'IDX_draft_history_league_id',
            columnNames: ['league_id'],
          },
        ],
      }),
      true
    );

    // Expert Content Cache table
    await queryRunner.createTable(
      new Table({
        name: 'expert_content_cache',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'content_type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'content_key',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'content_data',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'expires_at',
            type: 'timestamp',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'NOW()',
          },
        ],
        indices: [
          {
            name: 'IDX_expert_content_cache_type_key',
            columnNames: ['content_type', 'content_key'],
            isUnique: true,
          },
          {
            name: 'IDX_expert_content_cache_expires_at',
            columnNames: ['expires_at'],
          },
        ],
      }),
      true
    );

    // Create additional indexes for performance
    await queryRunner.createIndex(
      'espn_connections',
      new Index('IDX_espn_connections_expires_at', ['expires_at'])
    );

    await queryRunner.createIndex(
      'espn_leagues',
      new Index('IDX_espn_leagues_active', ['is_active'])
    );

    await queryRunner.createIndex(
      'draft_history',
      new Index('IDX_draft_history_user_date', ['user_id', 'draft_date'])
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order due to foreign key constraints
    await queryRunner.dropTable('expert_content_cache');
    await queryRunner.dropTable('draft_history');
    await queryRunner.dropTable('espn_leagues');
    await queryRunner.dropTable('espn_connections');
  }
}