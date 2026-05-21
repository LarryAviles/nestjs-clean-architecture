import { Task } from '../../domain/entities/task.entity';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { TaskOrmEntity } from './task.orm-entity';

export class TaskMapper {
  static toDomain(row: TaskOrmEntity): Task {
    return Task.restore({
      id: Uuid.create(row.id),
      userId: Uuid.create(row.userId),
      title: row.title,
      description: row.description,
      completed: row.completed,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toOrm(task: Task): TaskOrmEntity {
    const row = new TaskOrmEntity();
    row.id = task.id.toString();
    row.userId = task.userId.toString();
    row.title = task.title;
    row.description = task.description;
    row.completed = task.completed;
    row.createdAt = task.createdAt;
    row.updatedAt = task.updatedAt;
    return row;
  }
}
