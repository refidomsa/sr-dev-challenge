import { DomainError } from './domain.error';

export class SundayDeliveryError extends DomainError {
  readonly code = 'SUNDAY_DELIVERY';

  constructor() {
    super('The delivery date cannot be a Sunday');
  }
}
