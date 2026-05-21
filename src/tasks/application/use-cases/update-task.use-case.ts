import { TaskRepository } from '../../domain/repositories/task.repository';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { TaskNotFoundError } from '../../domain/errors/task-not-found.error';
import { UpdateTaskInput } from '../dtos/update-task.dto';
import { TaskOutput } from '../dtos/create-task.dto';
import { taskToOutput } from './task-output.mapper';

export class UpdateTaskUseCase {
  constructor(private readonly tasks: TaskRepository) {}

  async execute(input: UpdateTaskInput): Promise<TaskOutput> {
    const userId = Uuid.create(input.userId);
    const taskId = Uuid.create(input.taskId);
    const task = await this.tasks.findById(taskId);
    if (!task || !task.isOwnedBy(userId)) {
      throw new TaskNotFoundError();
    }
    task.apply({
      title: input.title,
      description: input.description,
      completed: input.completed,
    });
    await this.tasks.save(task);
    return taskToOutput(task);
  }
}
