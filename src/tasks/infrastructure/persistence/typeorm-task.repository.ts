import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { TaskOrmEntity } from './task.orm-entity';
import { TaskMapper } from './task.mapper';

@Injectable()
export class TypeOrmTaskRepository implements TaskRepository {
  constructor(
    @InjectRepository(TaskOrmEntity)
    private readonly repo: Repository<TaskOrmEntity>,
  ) {}

  async save(task: Task): Promise<void> {
    await this.repo.save(TaskMapper.toOrm(task));
  }

  async findById(id: Uuid): Promise<Task | null> {
    const row = await this.repo.findOne({ where: { id: id.toString() } });
    return row ? TaskMapper.toDomain(row) : null;
  }

  async findAllByUser(userId: Uuid): Promise<Task[]> {
    const rows = await this.repo.find({
      where: { userId: userId.toString() },
      order: { createdAt: 'DESC' },
    });
    return rows.map(TaskMapper.toDomain);
  }

  async delete(id: Uuid): Promise<void> {
    await this.repo.delete({ id: id.toString() });
  }
}
