import { DomainError } from './domain.error';

export class RejectionReasonRequiredError extends DomainError {
  readonly code = 'REJECTION_REASON_REQUIRED';

  constructor() {
    super('A reason is required to reject an order');
  }
}
