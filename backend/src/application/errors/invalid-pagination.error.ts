import { DomainError } from '../../domain/errors/domain.error';

export class InvalidPaginationError extends DomainError {
  readonly code = 'INVALID_PAGINATION';

  constructor(message: string) {
    super(message);
  }
}
