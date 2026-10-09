import { DeliveryTooSoonError } from '../errors/delivery-too-soon.error';
import { DuplicateProductError } from '../errors/duplicate-product.error';
import { InvalidLineCountError } from '../errors/invalid-line-count.error';
import { MaximumGallonsError } from '../errors/maximum-gallons.error';
import { SundayDeliveryError } from '../errors/sunday-delivery.error';
import { OrderLine } from './order-line';
import { RejectionReasonRequiredError } from '../errors/rejection-reason-required.error';
import { OrderStatus, assertTransition } from './order-status';

export const MAXIMUM_LINES_PER_ORDER = 4;
export const MAXIMUM_GALLONS_PER_ORDER = 9000;
export const MINIMUM_HOURS_BEFORE_DELIVERY = 24;

const DOMINICAN_HOURS_BEHIND_UTC = 4;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;
const SUNDAY = 0;

export class Order {
  readonly id: string;
  readonly distributor: string;
  readonly lines: OrderLine[];
  readonly deliveryDate: Date;
  readonly createdAt: Date;

  private status: OrderStatus;
  private statusChangedAt: Date | null;
  private rejectionReason: string | null;
  constructor(
    id: string,
    distributor: string,
    lines: OrderLine[], //Recip a array of Line
    deliveryDate: Date,
    createdAt: Date,
  ) {
    if (lines.length === 0 || lines.length > MAXIMUM_LINES_PER_ORDER) {
      throw new InvalidLineCountError(lines.length, MAXIMUM_LINES_PER_ORDER);
    }

    //1. Un pedido tiene entre 1 y 4 líneas, sin productos repetidos.
    const productsAlreadySeen: string[] = [];
    for (const line of lines) {
      const isRepeated = productsAlreadySeen.includes(line.productId);
      if (isRepeated) {
        throw new DuplicateProductError(line.productId);
      }
      productsAlreadySeen.push(line.productId);
    }

    //2. El pedido completo no puede superar 9,000 galones (capacidad de un camión).
    let totalGallons = 0;
    for (const line of lines) {
      totalGallons = totalGallons + line.gallons;
    }
    if (totalGallons > MAXIMUM_GALLONS_PER_ORDER) {
      throw new MaximumGallonsError(totalGallons, MAXIMUM_GALLONS_PER_ORDER);
    }

    //3. La fecha de entrega debe ser al menos 24 horas después de la creación
    const millisecondsUntilDelivery =
      deliveryDate.getTime() - createdAt.getTime();
    const hoursUntilDelivery =
      millisecondsUntilDelivery / MILLISECONDS_PER_HOUR;
    if (hoursUntilDelivery < MINIMUM_HOURS_BEFORE_DELIVERY) {
      throw new DeliveryTooSoonError(MINIMUM_HOURS_BEFORE_DELIVERY);
    }

    // 4. no puede ser domingo.
    const deliveryInDominicanTime = new Date(
      deliveryDate.getTime() -
        DOMINICAN_HOURS_BEHIND_UTC * MILLISECONDS_PER_HOUR,
    );
    const dayOfWeek = deliveryInDominicanTime.getUTCDay();
    if (dayOfWeek === SUNDAY) {
      throw new SundayDeliveryError();
    }

    this.id = id;
    this.distributor = distributor;
    this.lines = lines;
    this.deliveryDate = deliveryDate;
    this.createdAt = createdAt;

    this.status = OrderStatus.Pending;

    this.statusChangedAt = null;
    this.rejectionReason = null;
  }

  // Only for the repositories: puts back the status an order had when it was saved.
  // It does not check transitions, because the order already went through them.
  restoreStatus(
    status: OrderStatus,
    statusChangedAt: Date | null,
    rejectionReason: string | null,
  ): void {
    this.status = status;
    this.statusChangedAt = statusChangedAt;
    this.rejectionReason = rejectionReason;
  }

  getTotalGallons(): number {
    let totalGallons = 0;
    for (const line of this.lines) {
      totalGallons = totalGallons + line.gallons;
    }
    return totalGallons;
  }

  getTotalPay(): number {
    let totalPay = 0;
    for (const line of this.lines) {
      totalPay = totalPay + line.getSubtotalPay();
    }
    return totalPay;
  }

  getStatus(): OrderStatus {
    return this.status;
  }

  getStatusChangedAt(): Date | null {
    return this.statusChangedAt;
  }

  getRejectionReason(): string | null {
    return this.rejectionReason;
  }

  approve(changedAt: Date): void {
    this.changeStatus(OrderStatus.Approved, changedAt);
  }

  reject(reason: string, changedAt: Date): void {
    const hasNoReason = reason.trim().length === 0;
    if (hasNoReason) {
      throw new RejectionReasonRequiredError();
    }

    this.changeStatus(OrderStatus.Rejected, changedAt);
    this.rejectionReason = reason.trim();
  }

  cancel(changedAt: Date): void {
    this.changeStatus(OrderStatus.Cancelled, changedAt);
  }

  dispatch(changedAt: Date): void {
    this.changeStatus(OrderStatus.Dispatched, changedAt);
  }

  private changeStatus(newStatus: OrderStatus, changedAt: Date): void {
    assertTransition(this.status, newStatus);

    this.status = newStatus;
    this.statusChangedAt = changedAt;
  }

  usesCredit(): boolean {
    const isPending = this.status === OrderStatus.Pending;
    const isApproved = this.status === OrderStatus.Approved;

    return isPending || isApproved;
  }
}
