import { Module } from '@nestjs/common';

import { InMemoryTaskRepository } from './persistence/in-memory-task.repository';
import { TASK_REPOSITORY, TaskRepository } from '../domain/repositories/task.repository';
import { CreateTaskUseCase } from '../application/use-cases/create-task.use-case';
import { ListTasksUseCase } from '../application/use-cases/list-tasks.use-case';
import { GetTaskUseCase } from '../application/use-cases/get-task.use-case';
import { UpdateTaskUseCase } from '../application/use-cases/update-task.use-case';
import { DeleteTaskUseCase } from '../application/use-cases/delete-task.use-case';
import { TasksController } from '../presentation/controllers/tasks.controller';
import { AuthModule } from '../../auth/infrastructure/auth.module';

/**
 * Composition root for the tasks bounded context.
 *
 * To swap the in-memory store for a real database: implement `TaskRepository`
 * in a new adapter class and change the single `useClass` binding below.
 * Nothing in domain/ or application/ needs to change.
 *
 * AuthModule is imported solely to bring in JwtAuthGuard and the
 * TOKEN_GENERATOR it depends on. Tasks knows nothing about auth internals.
 */
@Module({
  imports: [AuthModule],
  controllers: [TasksController],
  providers: [
    // Change useClass here to swap to a DB-backed adapter
    { provide: TASK_REPOSITORY, useClass: InMemoryTaskRepository },

    {
      provide: CreateTaskUseCase,
      inject: [TASK_REPOSITORY],
      useFactory: (repo: TaskRepository) => new CreateTaskUseCase(repo),
    },
    {
      provide: ListTasksUseCase,
      inject: [TASK_REPOSITORY],
      useFactory: (repo: TaskRepository) => new ListTasksUseCase(repo),
    },
    {
      provide: GetTaskUseCase,
      inject: [TASK_REPOSITORY],
      useFactory: (repo: TaskRepository) => new GetTaskUseCase(repo),
    },
    {
      provide: UpdateTaskUseCase,
      inject: [TASK_REPOSITORY],
      useFactory: (repo: TaskRepository) => new UpdateTaskUseCase(repo),
    },
    {
      provide: DeleteTaskUseCase,
      inject: [TASK_REPOSITORY],
      useFactory: (repo: TaskRepository) => new DeleteTaskUseCase(repo),
    },
  ],
})
export class TasksModule {}
