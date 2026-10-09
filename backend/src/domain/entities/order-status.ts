import { InvalidTransitionError } from '../errors/invalid-transition.error';

// Mi state o maquina de estado
export enum OrderStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Dispatched = 'DISPATCHED', //Enviado
  Rejected = 'REJECTED', //Rechazado
  Cancelled = 'CANCELLED',
}

const ALLOWED_TRANSITIONS: Readonly<
  Record<OrderStatus, readonly OrderStatus[]>
> = {
  [OrderStatus.Pending]: [
    OrderStatus.Approved,
    OrderStatus.Rejected,
    OrderStatus.Cancelled,
  ],
  [OrderStatus.Approved]: [OrderStatus.Dispatched],
  [OrderStatus.Dispatched]: [],
  [OrderStatus.Rejected]: [],
  [OrderStatus.Cancelled]: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}
