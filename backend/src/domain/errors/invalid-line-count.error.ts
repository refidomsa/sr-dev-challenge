import { DomainError } from './domain.error';

export class InvalidLineCountError extends DomainError {
  readonly code = 'INVALID_LINE_COUNT';

  constructor(
    readonly lineCount: number,
    readonly maximum: number,
  ) {
    super(
      `An order needs between 1 and ${maximum} lines, received ${lineCount}`,
    );
  }
}
