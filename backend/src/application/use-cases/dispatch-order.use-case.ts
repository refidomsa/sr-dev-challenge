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

export interface ApproveOrderInput {
  // The user who is logged in and making the request.
  user: User;
  orderId: string;
}

@Injectable()
export class DispatchOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(input: ApproveOrderInput): Promise<Order> {
    // Permission: only an operator can approve orders
    if (!input.user.isOperator()) {
      throw new ForbiddenActionError('Only operators can approve orders');
    }

    const order = await this.orderRepository.findById(input.orderId);
    if (order === null) {
      throw new OrderNotFoundError(input.orderId);
    }

    // The order checks if this change of status is allowed
    order.dispatch(this.clock.now());

    await this.orderRepository.save(order);

    return order;
  }
}
