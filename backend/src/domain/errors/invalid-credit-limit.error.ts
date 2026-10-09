import { DomainError } from './domain.error';

export class InvalidCreditLimitError extends DomainError {
  readonly code = 'INVALID_CREDIT_LIMIT';

  constructor(readonly creditLimitCents: number) {
    super(
      `Credit limit must be a whole number of cents, zero or more, received ${creditLimitCents}`,
    );
  }
}
