import { Inject, Injectable } from '@nestjs/common';
import { Distributor } from '../../domain/entities/distributor';
import { User } from '../../domain/entities/user';
import {
  DISTRIBUTOR_REPOSITORY,
  type DistributorRepository,
} from '../../domain/repositories/distributor.repository';
import { ForbiddenActionError } from '../errors/forbidden-action.error';

export interface ListDistributorsInput {
  // The user who is logged in and making the request.
  user: User;
}

// The operator needs the list to filter the orders by distributor.
@Injectable()
export class ListDistributorsUseCase {
  constructor(
    @Inject(DISTRIBUTOR_REPOSITORY)
    private readonly distributorRepository: DistributorRepository,
  ) {}

  async execute(input: ListDistributorsInput): Promise<Distributor[]> {
    // Permission: only an operator can see all the distributors
    if (!input.user.isOperator()) {
      throw new ForbiddenActionError('Only operators can list distributors');
    }

    return this.distributorRepository.findAll();
  }
}
