import { DomainError } from './domain.error';

export class InsufficientCreditError extends DomainError {
  readonly code = 'INSUFFICIENT_CREDIT';

  constructor(
    readonly orderTotalCents: number,
    readonly availableCreditCents: number,
  ) {
    super(
      `The order total (${orderTotalCents} cents) exceeds the available credit (${availableCreditCents} cents)`,
    );
  }
}
