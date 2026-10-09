import { Order } from '../../domain/entities/order';

// The shape of an order in the JSON answers.
export interface OrderLineResponse {
  productId: string;
  gallons: number;
  unitPriceCents: number;
  subtotalCents: number;
}

export interface OrderResponse {
  id: string;
  distributorId: string;
  deliveryDate: string;
  createdAt: string;
  status: string;
  statusChangedAt: string | null;
  rejectionReason: string | null;
  totalGallons: number;
  totalCents: number;
  lines: OrderLineResponse[];
}

export function toOrderResponse(order: Order): OrderResponse {
  const lines: OrderLineResponse[] = [];
  for (const line of order.lines) {
    lines.push({
      productId: line.productId,
      gallons: line.gallons,
      unitPriceCents: line.unitPriceCents,
      subtotalCents: line.getSubtotalPay(),
    });
  }

  let statusChangedAt: string | null = null;
  const changedAt = order.getStatusChangedAt();
  if (changedAt !== null) {
    statusChangedAt = changedAt.toISOString();
  }

  return {
    id: order.id,
    distributorId: order.distributor,
    deliveryDate: order.deliveryDate.toISOString(),
    createdAt: order.createdAt.toISOString(),
    status: order.getStatus(),
    statusChangedAt: statusChangedAt,
    rejectionReason: order.getRejectionReason(),
    totalGallons: order.getTotalGallons(),
    totalCents: order.getTotalPay(),
    lines: lines,
  };
}
