import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  LoginResult,
  LoginUseCase,
} from '../../application/use-cases/login.use-case';
import { LoginDto } from '../dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly login: LoginUseCase) { }

  // POST /auth/login
  @Post('login')
  @HttpCode(200)
  async loginUser(@Body() body: LoginDto): Promise<LoginResult> {
    return this.login.execute({
      email: body.email!,
      password: body.password!,
    });
  }
}
