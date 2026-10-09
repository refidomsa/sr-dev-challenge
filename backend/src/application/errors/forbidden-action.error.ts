import { DomainError } from '../../domain/errors/domain.error';

// The user is logged in, but their role is not allowed to do this.
export class ForbiddenActionError extends DomainError {
  readonly code = 'FORBIDDEN_ACTION';

  constructor(message: string) {
    super(message);
  }
}
