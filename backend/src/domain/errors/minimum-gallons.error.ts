import { DomainError } from './domain.error';

export class MinimumGallonsError extends DomainError {
  readonly code = 'MINIMUM_GALLONS_NOT_MET';

  constructor(
    readonly gallons: number,
    readonly minimum: number,
  ) {
    super(`Each line needs at least ${minimum} gallons, received ${gallons}`);
  }
}
