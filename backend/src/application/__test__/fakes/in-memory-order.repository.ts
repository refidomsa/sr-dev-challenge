import { Order } from '../../../domain/entities/order';
import {
  OrderRepository,
  OrderSearch,
  OrderSearchResult,
} from '../../../domain/repositories/order.repository';

export class InMemoryOrderRepository implements OrderRepository {
  orders: Order[] = [];

  findById(id: string): Promise<Order | null> {
    for (const order of this.orders) {
      if (order.id === id) {
        return Promise.resolve(order);
      }
    }
    return Promise.resolve(null);
  }

  findByDistributor(distributorId: string): Promise<Order[]> {
    const ordersOfDistributor: Order[] = [];
    for (const order of this.orders) {
      if (order.distributor === distributorId) {
        ordersOfDistributor.push(order);
      }
    }
    return Promise.resolve(ordersOfDistributor);
  }

  save(order: Order): Promise<void> {
    // Replace the order if it is already in the list, otherwise add it
    const ordersWithoutThisOne: Order[] = [];
    for (const savedOrder of this.orders) {
      if (savedOrder.id !== order.id) {
        ordersWithoutThisOne.push(savedOrder);
      }
    }
    ordersWithoutThisOne.push(order);
    this.orders = ordersWithoutThisOne;

    return Promise.resolve();
  }

  search(search: OrderSearch): Promise<OrderSearchResult> {
    // 1. Keep only the orders that pass every filter
    const matchingOrders: Order[] = [];
    for (const order of this.orders) {
      const isOfAnotherDistributor =
        search.distributorId !== null &&
        order.distributor !== search.distributorId;
      if (isOfAnotherDistributor) {
        continue;
      }

      const hasAnotherStatus =
        search.status !== null && order.getStatus() !== search.status;
      if (hasAnotherStatus) {
        continue;
      }

      const isBeforeTheRange =
        search.deliveryFrom !== null &&
        order.deliveryDate < search.deliveryFrom;
      if (isBeforeTheRange) {
        continue;
      }

      const isAfterTheRange =
        search.deliveryTo !== null && order.deliveryDate > search.deliveryTo;
      if (isAfterTheRange) {
        continue;
      }

      matchingOrders.push(order);
    }

    // 2. Newest first
    matchingOrders.sort((first, second) => {
      return second.createdAt.getTime() - first.createdAt.getTime();
    });

    // 3. Cut the requested page
    const firstPosition = (search.page - 1) * search.pageSize;
    const lastPosition = firstPosition + search.pageSize;
    const ordersOfPage = matchingOrders.slice(firstPosition, lastPosition);

    return Promise.resolve({
      orders: ordersOfPage,
      total: matchingOrders.length,
    });
  }
}
