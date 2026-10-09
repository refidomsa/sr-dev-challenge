import { Order } from '../entities/order';
import { OrderStatus } from '../entities/order-status';

export const ORDER_REPOSITORY = 'OrderRepository';

// What to look for when listing orders.
// A filter with the value null is not applied.
export interface OrderSearch {
  distributorId: string | null;
  status: OrderStatus | null;
  // Range of the delivery date. Both ends are included.
  deliveryFrom: Date | null;
  deliveryTo: Date | null;
  // The first page is page 1.
  page: number;
  pageSize: number;
}

export interface OrderSearchResult {
  // Only the orders of the requested page, newest first.
  orders: Order[];
  // How many orders match the filters, counting all the pages.
  total: number;
}

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findByDistributor(distributorId: string): Promise<Order[]>;
  search(search: OrderSearch): Promise<OrderSearchResult>;
  save(order: Order): Promise<void>;
}
