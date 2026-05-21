import { Task } from '../../../domain/entities/task.entity';
import { TaskRepository } from '../../../domain/repositories/task.repository';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

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

  size(): number {
    return this.store.size;
  }
}
