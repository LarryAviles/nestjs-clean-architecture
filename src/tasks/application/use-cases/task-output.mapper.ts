import { Task } from '../../domain/entities/task.entity';
import { TaskOutput } from '../dtos/create-task.dto';

/**
 * Application-layer mapper: domain entity → outbound DTO. Kept here (not in
 * presentation) so every use case returns the same shape, and the controller
 * stays a pure passthrough.
 */
export function taskToOutput(task: Task): TaskOutput {
  return {
    id: task.id.toString(),
    userId: task.userId.toString(),
    title: task.title,
    description: task.description,
    completed: task.completed,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}
