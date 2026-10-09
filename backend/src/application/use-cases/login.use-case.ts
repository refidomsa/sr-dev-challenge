import { Inject, Injectable } from '@nestjs/common';
import { UserRole } from '../../domain/entities/user';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../domain/repositories/user.repository';
import { InvalidCredentialsError } from '../errors/invalid-credentials.error';
import { PASSWORD_HASHER, type PasswordHasher } from '../ports/password-hasher';
import { TOKEN_SERVICE, type TokenService } from '../ports/token-service';

export interface LoginInput {
  email: string;
  password: string;
}

// What the frontend receives after logging in.
// It never includes the password hash.
export interface LoginResult {
  accessToken: string;
  userId: string;
  name: string;
  role: UserRole;
  distributorId: string | null;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(input.email);
    if (user === null) {
      throw new InvalidCredentialsError();
    }

    const isPasswordCorrect = await this.passwordHasher.matches(
      input.password,
      user.passwordHash,
    );
    if (!isPasswordCorrect) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.tokenService.sign({
      userId: user.id,
      role: user.role,
      distributorId: user.distributorId,
    });

    return {
      accessToken: accessToken,
      userId: user.id,
      name: user.name,
      role: user.role,
      distributorId: user.distributorId,
    };
  }
}
