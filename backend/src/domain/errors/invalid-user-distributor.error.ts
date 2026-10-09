import { DomainError } from './domain.error';

export class InvalidUserDistributorError extends DomainError {
  readonly code = 'INVALID_USER_DISTRIBUTOR';

  constructor(message: string) {
    super(message);
  }
}
