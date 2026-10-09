import { DomainError } from './domain.error';

export class InvalidPriceError extends DomainError {
  readonly code = 'INVALID_PRICE';

  constructor(readonly priceCents: number) {
    super(
      `Price must be a positive whole number of cents, received ${priceCents}`,
    );
  }
}
