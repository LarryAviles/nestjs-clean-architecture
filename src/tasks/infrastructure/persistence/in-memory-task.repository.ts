import { Injectable } from '@nestjs/common';
import { Task } from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';

/**
 * Repository pattern (in-memory adapter).
 *
 * The port lives in `domain/repositories/task.repository.ts`. This Map-backed
 * class satisfies the same interface a TypeORM or Prisma adapter would. To
 * swap to a real database: implement `TaskRepository` in a new file and change
 * the single `useClass` binding in tasks.module.ts — nothing else.
 *
 * All methods return Promise to keep the port contract async-first, identical
 * to what any real data source would expose.
 */
@Injectable()
export class InMemoryTaskRepository implements TaskRepository {
  private readonly store = new Map<string, Task>();

  async save(task: Task): Promise<void> {
    this.store.set(task.id.toString(), task);
  }

  async findById(id: Uuid): Promise<Task | null> {
    return this.store.get(id.toString()) ?? null;
  }

  async findAllByUser(userId: Uuid): Promise<Task[]> {
    return [...this.store.values()].filter((t) => t.isOwnedBy(userId));
  }

  async delete(id: Uuid): Promise<void> {
    this.store.delete(id.toString());
  }
}
