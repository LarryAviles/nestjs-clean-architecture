import { TaskRepository } from '../../domain/repositories/task.repository';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { TaskOutput } from '../dtos/create-task.dto';
import { taskToOutput } from './task-output.mapper';

export class ListTasksUseCase {
  constructor(private readonly tasks: TaskRepository) {}

  async execute(input: { userId: string }): Promise<TaskOutput[]> {
    const userId = Uuid.create(input.userId);
    const rows = await this.tasks.findAllByUser(userId);
    return rows.map(taskToOutput);
  }
}
