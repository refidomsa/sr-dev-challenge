import { DomainError } from '../../domain/errors/domain.error';

export class OrderNotFoundError extends DomainError {
  readonly code = 'ORDER_NOT_FOUND';

  constructor(readonly orderId: string) {
    super(`Order ${orderId} does not exist`);
  }
}
