import { DomainError } from '../../domain/errors/domain.error';

export class DistributorNotFoundError extends DomainError {
  readonly code = 'DISTRIBUTOR_NOT_FOUND';

  constructor(readonly distributorId: string) {
    super(`Distributor ${distributorId} does not exist`);
  }
}
