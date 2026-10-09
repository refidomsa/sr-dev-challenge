import type { OrderStatus } from '../entities/order-status';
import { DomainError } from './domain.error';

export class InvalidTransitionError extends DomainError {
  readonly code = 'INVALID_TRANSITION';

  constructor(
    readonly from: OrderStatus,
    readonly to: OrderStatus,
  ) {
    super(`An order in status ${from} cannot change to ${to}`);
  }
}
