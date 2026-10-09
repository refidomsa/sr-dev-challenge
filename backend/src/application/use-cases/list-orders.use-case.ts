import { Inject, Injectable } from '@nestjs/common';
import { OrderStatus } from '../../domain/entities/order-status';
import { User } from '../../domain/entities/user';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
  type OrderSearchResult,
} from '../../domain/repositories/order.repository';
import { InvalidPaginationError } from '../errors/invalid-pagination.error';

export const MAXIMUM_PAGE_SIZE = 100;

export interface ListOrdersInput {
  // The user who is logged in and making the request.
  user: User;
  // Filters. A filter with the value null is not applied.
  distributorId: string | null;
  status: OrderStatus | null;
  deliveryFrom: Date | null;
  deliveryTo: Date | null;
  // The first page is page 1.
  page: number;
  pageSize: number;
}

@Injectable()
export class ListOrdersUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
  ) {}

  async execute(input: ListOrdersInput): Promise<OrderSearchResult> {
    const isPageTooLow = input.page < 1;
    if (isPageTooLow) {
      throw new InvalidPaginationError('The page must be 1 or more');
    }

    const isPageSizeTooLow = input.pageSize < 1;
    if (isPageSizeTooLow) {
      throw new InvalidPaginationError('The page size must be 1 or more');
    }

    const isPageSizeTooHigh = input.pageSize > MAXIMUM_PAGE_SIZE;
    if (isPageSizeTooHigh) {
      throw new InvalidPaginationError(
        `The page size cannot be more than ${MAXIMUM_PAGE_SIZE}`,
      );
    }

    // Permission: an operator sees all the orders and can filter by distributor.
    let distributorId = input.distributorId;

    // Permission: a distributor only sees its own orders.
    // Whatever distributor it asks for, it is replaced by its own.
    if (input.user.isDistributor()) {
      distributorId = input.user.distributorId;
    }

    return this.orderRepository.search({
      distributorId: distributorId,
      status: input.status,
      deliveryFrom: input.deliveryFrom,
      deliveryTo: input.deliveryTo,
      page: input.page,
      pageSize: input.pageSize,
    });
  }
}
