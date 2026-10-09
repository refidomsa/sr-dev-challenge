import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user';
import {
  DISTRIBUTOR_REPOSITORY,
  type DistributorRepository,
} from '../../domain/repositories/distributor.repository';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../domain/repositories/order.repository';
import { DistributorNotFoundError } from '../errors/distributor-not-found.error';

export interface GetAvailableCreditInput {
  // The user who is logged in and making the request.
  user: User;
  distributorId: string;
}

export interface AvailableCredit {
  distributorId: string;
  creditLimitCents: number;
  availableCreditCents: number;
}

@Injectable()
export class GetAvailableCreditUseCase {
  constructor(
    @Inject(DISTRIBUTOR_REPOSITORY)
    private readonly distributorRepository: DistributorRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(input: GetAvailableCreditInput): Promise<AvailableCredit> {
    // Permission: an operator can ask for the credit of any distributor.
    // Permission: a distributor can only ask for its own credit.
    // The answer is "not found" so it does not reveal that the distributor exists.
    if (input.user.isDistributor()) {
      const isOwnDistributor = input.user.belongsToDistributor(
        input.distributorId,
      );
      if (!isOwnDistributor) {
        throw new DistributorNotFoundError(input.distributorId);
      }
    }

    const distributor = await this.distributorRepository.findById(
      input.distributorId,
    );
    if (distributor === null) {
      throw new DistributorNotFoundError(input.distributorId);
    }

    const orders = await this.orderRepository.findByDistributor(distributor.id);

    // The distributor is who knows how to calculate its available credit.
    const availableCreditCents = distributor.getAvailableCredit(orders);

    return {
      distributorId: distributor.id,
      creditLimitCents: distributor.creditLimitCents,
      availableCreditCents: availableCreditCents,
    };
  }
}
