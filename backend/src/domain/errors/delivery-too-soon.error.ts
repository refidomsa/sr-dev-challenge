import { DomainError } from './domain.error';

export class DeliveryTooSoonError extends DomainError {
  readonly code = 'DELIVERY_TOO_SOON';

  constructor(readonly minimumHours: number) {
    super(
      `The delivery date must be at least ${minimumHours} hours after the order is created`,
    );
  }
}
