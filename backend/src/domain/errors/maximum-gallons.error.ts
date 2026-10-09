import { DomainError } from './domain.error';

export class MaximumGallonsError extends DomainError {
  readonly code = 'MAXIMUM_GALLONS_EXCEEDED';

  constructor(
    readonly gallons: number,
    readonly maximum: number,
  ) {
    super(`An order cannot exceed ${maximum} gallons, received ${gallons}`);
  }
}
