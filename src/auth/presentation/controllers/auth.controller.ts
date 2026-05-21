import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { RegisterHttpDto } from '../http-dtos/register.http-dto';
import { LoginHttpDto } from '../http-dtos/login.http-dto';

/**
 * Thin controller: parse request → call use case → return response.
 * No business logic, no error mapping. Errors thrown by use cases bubble up
 * to the global `DomainExceptionFilter`.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() body: RegisterHttpDto) {
    return this.registerUser.execute({ email: body.email, password: body.password });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginHttpDto) {
    return this.loginUser.execute({ email: body.email, password: body.password });
  }
}
