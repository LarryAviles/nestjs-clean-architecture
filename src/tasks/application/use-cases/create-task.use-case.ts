import { Task } from '../../domain/entities/task.entity';
import { TaskRepository } from '../../domain/repositories/task.repository';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { CreateTaskInput, TaskOutput } from '../dtos/create-task.dto';
import { taskToOutput } from './task-output.mapper';

export class CreateTaskUseCase {
  constructor(private readonly tasks: TaskRepository) {}

  async execute(input: CreateTaskInput): Promise<TaskOutput> {
    const task = Task.create({
      userId: Uuid.create(input.userId),
      title: input.title,
      description: input.description ?? null,
    });
    await this.tasks.save(task);
    return taskToOutput(task);
  }
}
