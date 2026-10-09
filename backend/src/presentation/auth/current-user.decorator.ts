import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../domain/entities/user';
import { AuthenticatedRequest } from './auth.guard';

// Lets a controller receive the logged-in user as a parameter: @CurrentUser() user: User
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): User => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
