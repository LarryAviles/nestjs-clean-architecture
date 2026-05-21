import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TaskOrmEntity } from './persistence/task.orm-entity';
import { TypeOrmTaskRepository } from './persistence/typeorm-task.repository';
import {
  TASK_REPOSITORY,
  TaskRepository,
} from '../domain/repositories/task.repository';
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
 * `AuthModule` is imported solely to bring in `JwtAuthGuard` and the
 * `TOKEN_GENERATOR` provider that guard depends on. Tasks knows nothing
 * about how auth is implemented — only that it gets a guard.
 */
@Module({
  imports: [TypeOrmModule.forFeature([TaskOrmEntity]), AuthModule],
  controllers: [TasksController],
  providers: [
    { provide: TASK_REPOSITORY, useClass: TypeOrmTaskRepository },

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
