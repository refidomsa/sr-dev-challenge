import { DomainError } from '../../domain/errors/domain.error';

export class ProductNotFoundError extends DomainError {
  readonly code = 'PRODUCT_NOT_FOUND';

  constructor(readonly productId: string) {
    super(`Product ${productId} does not exist`);
  }
}
