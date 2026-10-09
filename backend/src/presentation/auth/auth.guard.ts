import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '../../application/ports/token-service';
import { User } from '../../domain/entities/user';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../domain/repositories/user.repository';

export interface AuthenticatedRequest extends Request {
  user: User;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // The header looks like: "Authorization: Bearer <token>"
    const header = request.headers.authorization ?? '';
    const hasBearerToken = header.startsWith('Bearer ');
    if (!hasBearerToken) {
      throw new UnauthorizedException('The access token is missing');
    }

    const token = header.substring('Bearer '.length);
    const payload = await this.tokenService.verify(token);
    if (payload === null) {
      throw new UnauthorizedException('The access token is not valid');
    }

    const user = await this.userRepository.findById(payload.userId);
    if (user === null) {
      throw new UnauthorizedException('The user of the token does not exist');
    }

    // The controllers read the user from here
    request.user = user;
    return true;
  }
}
