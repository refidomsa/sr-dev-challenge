import { DomainError } from './domain.error';

export class InvalidGallonsError extends DomainError {
  readonly code = 'INVALID_GALLONS';

  constructor(readonly gallons: number) {
    super(`Gallons must be a whole number, received ${gallons}`);
  }
}
