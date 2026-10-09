import { request } from './client';
import type {
  AvailableCredit,
  Distributor,
  NewOrderLine,
  Order,
  OrderFilters,
  OrderList,
  Product,
  Session,
} from './types';

export const PAGE_SIZE = 10;

export function login(email: string, password: string): Promise<Session> {
  return request<Session>('POST', '/auth/login', null, {
    email: email,
    password: password,
  });
}

export function listProducts(token: string): Promise<Product[]> {
  return request<Product[]>('GET', '/products', token);
}

export function listDistributors(token: string): Promise<Distributor[]> {
  return request<Distributor[]>('GET', '/distributors', token);
}

export function getAvailableCredit(
  token: string,
  distributorId: string,
): Promise<AvailableCredit> {
  return request<AvailableCredit>(
    'GET',
    `/distributors/${distributorId}/credit`,
    token,
  );
}

export function listOrders(
  token: string,
  filters: OrderFilters,
): Promise<OrderList> {
  // Only the filters that have a value go in the URL
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('pageSize', String(PAGE_SIZE));
  if (filters.status !== '') {
    params.set('status', filters.status);
  }
  if (filters.distributorId !== '') {
    params.set('distributorId', filters.distributorId);
  }
  if (filters.deliveryFrom !== '') {
    params.set('deliveryFrom', filters.deliveryFrom);
  }
  if (filters.deliveryTo !== '') {
    params.set('deliveryTo', filters.deliveryTo);
  }

  return request<OrderList>('GET', `/orders?${params.toString()}`, token);
}

export function getOrder(token: string, orderId: string): Promise<Order> {
  return request<Order>('GET', `/orders/${orderId}`, token);
}

export function createOrder(
  token: string,
  deliveryDate: string,
  lines: NewOrderLine[],
): Promise<Order> {
  return request<Order>('POST', '/orders', token, {
    deliveryDate: deliveryDate,
    lines: lines,
  });
}

export function approveOrder(token: string, orderId: string): Promise<Order> {
  return request<Order>('POST', `/orders/${orderId}/approve`, token);
}

export function rejectOrder(
  token: string,
  orderId: string,
  reason: string,
): Promise<Order> {
  return request<Order>('POST', `/orders/${orderId}/reject`, token, {
    reason: reason,
  });
}

export function dispatchOrder(token: string, orderId: string): Promise<Order> {
  return request<Order>('POST', `/orders/${orderId}/dispatch`, token);
}

export function cancelOrder(token: string, orderId: string): Promise<Order> {
  return request<Order>('POST', `/orders/${orderId}/cancel`, token);
}
