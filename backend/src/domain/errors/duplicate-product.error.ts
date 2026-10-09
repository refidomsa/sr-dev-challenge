import { DomainError } from './domain.error';

export class DuplicateProductError extends DomainError {
  readonly code = 'DUPLICATE_PRODUCT';

  constructor(readonly product: string) {
    super(`Product ${product} appears in more than one line`);
  }
}
