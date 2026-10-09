// The shapes of what the backend answers.

export type UserRole = 'DISTRIBUTOR' | 'OPERATOR';

export type OrderStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'REJECTED'
  | 'CANCELLED';

export interface Session {
  accessToken: string;
  userId: string;
  name: string;
  role: UserRole;
  distributorId: string | null;
}

export interface Product {
  id: string;
  name: string;
  pricePerGallonCents: number;
}

export interface Distributor {
  id: string;
  name: string;
  rnc: string;
}

export interface AvailableCredit {
  distributorId: string;
  creditLimitCents: number;
  availableCreditCents: number;
}

export interface OrderLine {
  productId: string;
  gallons: number;
  unitPriceCents: number;
  subtotalCents: number;
}

export interface Order {
  id: string;
  distributorId: string;
  deliveryDate: string;
  createdAt: string;
  status: OrderStatus;
  statusChangedAt: string | null;
  rejectionReason: string | null;
  totalGallons: number;
  totalCents: number;
  lines: OrderLine[];
}

export interface OrderList {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OrderFilters {
  status: string;
  distributorId: string;
  deliveryFrom: string;
  deliveryTo: string;
  page: number;
}

export interface NewOrderLine {
  productId: string;
  gallons: number;
}
