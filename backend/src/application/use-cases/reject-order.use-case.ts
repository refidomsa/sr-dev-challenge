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

export interface RejectOrderInputt {
  // The user who is logged in and making the request.
  user: User;
  orderId: string;
  reason: string;
}

@Injectable()
export class RejectOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async execute(input: RejectOrderInputt): Promise<Order> {
    // Permission: only an operator can approve orders
    if (!input.user.isOperator()) {
      throw new ForbiddenActionError('Only operators can approve orders');
    }

    const order = await this.orderRepository.findById(input.orderId);
    if (order === null) {
      throw new OrderNotFoundError(input.orderId);
    }

    order.reject(input.reason, this.clock.now());

    await this.orderRepository.save(order);

    return order;
  }
}
