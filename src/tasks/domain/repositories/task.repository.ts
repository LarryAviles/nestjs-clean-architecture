import { Task } from '../entities/task.entity';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';

export interface TaskRepository {
  save(task: Task): Promise<void>;
  findById(id: Uuid): Promise<Task | null>;
  findAllByUser(userId: Uuid): Promise<Task[]>;
  delete(id: Uuid): Promise<void>;
}

export const TASK_REPOSITORY = 'TASK_REPOSITORY';
