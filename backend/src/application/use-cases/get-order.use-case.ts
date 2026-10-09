import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../domain/entities/order';
import { User } from '../../domain/entities/user';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../domain/repositories/order.repository';
import { OrderNotFoundError } from '../errors/order-not-found.error';

export interface GetOrderInput {
  // The user who is logged in and making the request.
  user: User;
  orderId: string;
}

@Injectable()
export class GetOrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(input: GetOrderInput): Promise<Order> {
    const order = await this.orderRepository.findById(input.orderId);
    if (order === null) {
      throw new OrderNotFoundError(input.orderId);
    }

    // Permission: an operator sees any order.
    if (input.user.isOperator()) {
      return order;
    }

    // Permission: a distributor only sees its own orders.
    // The answer is "not found" so it does not reveal that the order exists.
    const isOwnOrder = input.user.belongsToDistributor(order.distributor);
    if (!isOwnOrder) {
      throw new OrderNotFoundError(input.orderId);
    }

    return order;
  }
}
