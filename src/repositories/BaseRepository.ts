import { Repository, EntityTarget, DataSource, FindOptionsWhere, FindManyOptions, FindOneOptions, ObjectLiteral, DeepPartial } from 'typeorm';

export abstract class BaseRepository<T extends ObjectLiteral> {
  protected repository: Repository<T>;
  protected dataSource: DataSource;

  constructor(dataSource: DataSource, entity: EntityTarget<T>) {
    this.dataSource = dataSource;
    this.repository = dataSource.getRepository(entity);
  }

  async findById(id: string): Promise<T | null> {
    return this.repository.findOne({ where: { id } as any });
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  async findMany(options: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async create(entity: DeepPartial<T>): Promise<T> {
    const newEntity = this.repository.create(entity);
    return this.repository.save(newEntity);
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    await this.repository.update(id, updates as any);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  async exists(options: FindOptionsWhere<T>): Promise<boolean> {
    const count = await this.repository.count({ where: options });
    return count > 0;
  }

  async bulkCreate(entities: DeepPartial<T>[]): Promise<T[]> {
    const newEntities = this.repository.create(entities);
    return this.repository.save(newEntities);
  }

  async bulkUpdate(updates: Array<{ id: string; data: Partial<T> }>): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const update of updates) {
        await queryRunner.manager.update(this.repository.target, update.id, update.data as any);
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  getRepository(): Repository<T> {
    return this.repository;
  }
}