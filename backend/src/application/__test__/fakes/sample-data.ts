import { Order } from '../../../domain/entities/order';
import { OrderLine } from '../../../domain/entities/order-line';
import { ProductId } from '../../../domain/entities/product';
import { User, UserRole } from '../../../domain/entities/user';

// Data that many tests need, written once so the tests stay short.

export const operatorUser = new User(
  'user-1',
  'Luis Gómez',
  'luis@refidomsa.com',
  'hashed-password',
  UserRole.Operator,
  null,
);

export const distributorUser = new User(
  'user-2',
  'Ana Pérez',
  'ana@losprados.com',
  'hashed-password',
  UserRole.Distributor,
  'distributor-1',
);

export const userOfAnotherDistributor = new User(
  'user-3',
  'Carlos Díaz',
  'carlos@elcaribe.com',
  'hashed-password',
  UserRole.Distributor,
  'distributor-2',
);

// A valid Pending order of 500 gallons of Premium at RD$290.10 = RD$145,050.00.
// The dates are written in UTC: 14:00 UTC is 10:00 in Dominican time.
// createdDay and deliveryDay are days like '2026-10-08'. The delivery cannot be a Sunday.
export function buildOrder(
  id: string,
  distributorId: string,
  createdDay: string,
  deliveryDay: string,
): Order {
  const line = new OrderLine(ProductId.PremiumGasoline, 500, 29010);
  const createdAt = new Date(`${createdDay}T14:00:00Z`);
  const deliveryDate = new Date(`${deliveryDay}T14:00:00Z`);

  return new Order(id, distributorId, [line], deliveryDate, createdAt);
}
