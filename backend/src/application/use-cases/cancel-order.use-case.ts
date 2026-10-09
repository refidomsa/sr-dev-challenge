import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../domain/entities/order';
import { User } from '../../domain/entities/user';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../domain/repositories/order.repository';
import { ForbiddenActionError } from '../errors/forbidden-action.error';
import { OrderNotFoundError } from '../errors/order-not-found.error';
import { CLOCK, type Clock } from '../ports/clock';

export interface CancelOrderInput {
  // The user who is logged in and making the request.
  user: User;
  orderId: string;
}

@Injectable()
export class CancelOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(input: CancelOrderInput): Promise<Order> {
    // Permission: only a distributor cancel all orders
    if (!input.user.isDistributor()) {
      throw new ForbiddenActionError('Only distributors can cancel orders');
    }

    const order = await this.orderRepository.findById(input.orderId);
    if (order === null) {
      throw new OrderNotFoundError(input.orderId);
    }

    // Permission: a distributor can only cancel its own orders.
    // The answer is "not found" so it does not reveal that the order exists.
    const isOwnOrder = input.user.belongsToDistributor(order.distributor);
    if (!isOwnOrder) {
      throw new OrderNotFoundError(input.orderId);
    }

    // The order checks if this change of status is allowed
    order.cancel(this.clock.now());

    await this.orderRepository.save(order);

    return order;
  }
}
