import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateTaskUseCase } from '../../application/use-cases/create-task.use-case';
import { ListTasksUseCase } from '../../application/use-cases/list-tasks.use-case';
import { GetTaskUseCase } from '../../application/use-cases/get-task.use-case';
import { UpdateTaskUseCase } from '../../application/use-cases/update-task.use-case';
import { DeleteTaskUseCase } from '../../application/use-cases/delete-task.use-case';
import { CreateTaskHttpDto } from '../http-dtos/create-task.http-dto';
import { UpdateTaskHttpDto } from '../http-dtos/update-task.http-dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { TokenPayload } from '../../../auth/application/ports/token-generator.port';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(
    private readonly createTask: CreateTaskUseCase,
    private readonly listTasks: ListTasksUseCase,
    private readonly getTask: GetTaskUseCase,
    private readonly updateTask: UpdateTaskUseCase,
    private readonly deleteTask: DeleteTaskUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser() user: TokenPayload, @Body() body: CreateTaskHttpDto) {
    return this.createTask.execute({
      userId: user.sub,
      title: body.title,
      description: body.description ?? null,
    });
  }

  @Get()
  list(@CurrentUser() user: TokenPayload) {
    return this.listTasks.execute({ userId: user.sub });
  }

  @Get(':id')
  get(
    @CurrentUser() user: TokenPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.getTask.execute({ userId: user.sub, taskId: id });
  }

  @Patch(':id')
  update(
    @CurrentUser() user: TokenPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateTaskHttpDto,
  ) {
    return this.updateTask.execute({
      userId: user.sub,
      taskId: id,
      title: body.title,
      description: body.description,
      completed: body.completed,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: TokenPayload,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.deleteTask.execute({ userId: user.sub, taskId: id });
  }
}
