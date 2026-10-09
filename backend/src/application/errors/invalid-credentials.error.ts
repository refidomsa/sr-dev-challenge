import { DomainError } from '../../domain/errors/domain.error';

export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('The email or the password is not correct');
  }
}
