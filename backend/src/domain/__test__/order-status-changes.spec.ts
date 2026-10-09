import { Order } from '../entities/order';
import { OrderLine } from '../entities/order-line';
import { OrderStatus } from '../entities/order-status';
import { ProductId } from '../entities/product';
import { InvalidTransitionError } from '../errors/invalid-transition.error';
import { RejectionReasonRequiredError } from '../errors/rejection-reason-required.error';

const createdAt = new Date('2026-10-08T14:00:00Z');
const deliveryDate = new Date('2026-10-09T14:00:00Z');
const changedAt = new Date('2026-10-08T19:00:00Z');

function createPendingOrder(): Order {
  const line = new OrderLine(ProductId.PremiumGasoline, 500, 29010);
  return new Order('order-1', 'distributor-1', [line], deliveryDate, createdAt);
}

describe('Order status changes', () => {
  describe('a new order', () => {
    it('has no status change date yet', () => {
      const order = createPendingOrder();

      expect(order.getStatusChangedAt()).toBeNull();
    });

    it('has no rejection reason', () => {
      const order = createPendingOrder();

      expect(order.getRejectionReason()).toBeNull();
    });
  });

  describe('approve', () => {
    it('changes a Pending order to Approved', () => {
      const order = createPendingOrder();

      order.approve(changedAt);

      expect(order.getStatus()).toBe(OrderStatus.Approved);
    });

    it('records when the status changed', () => {
      const order = createPendingOrder();

      order.approve(changedAt);

      expect(order.getStatusChangedAt()).toBe(changedAt);
    });

    it('cannot approve an order that is already Approved', () => {
      const order = createPendingOrder();
      order.approve(changedAt);

      expect(() => order.approve(changedAt)).toThrow(InvalidTransitionError);
    });
  });

  describe('reject', () => {
    it('changes a Pending order to Rejected', () => {
      const order = createPendingOrder();

      order.reject('Credit under review', changedAt);

      expect(order.getStatus()).toBe(OrderStatus.Rejected);
    });

    it('keeps the reason', () => {
      const order = createPendingOrder();

      order.reject('Credit under review', changedAt);

      expect(order.getRejectionReason()).toBe('Credit under review');
    });

    it('requires a reason', () => {
      const order = createPendingOrder();

      expect(() => order.reject('', changedAt)).toThrow(
        RejectionReasonRequiredError,
      );
    });

    it('does not accept a reason made only of spaces', () => {
      const order = createPendingOrder();

      expect(() => order.reject('   ', changedAt)).toThrow(
        RejectionReasonRequiredError,
      );
    });

    it('leaves the order Pending when the reason is missing', () => {
      const order = createPendingOrder();

      expect(() => order.reject('', changedAt)).toThrow();

      expect(order.getStatus()).toBe(OrderStatus.Pending);
    });

    it('cannot reject an order that is already Approved', () => {
      const order = createPendingOrder();
      order.approve(changedAt);

      expect(() => order.reject('Changed my mind', changedAt)).toThrow(
        InvalidTransitionError,
      );
    });
  });

  describe('cancel', () => {
    it('changes a Pending order to Cancelled', () => {
      const order = createPendingOrder();

      order.cancel(changedAt);

      expect(order.getStatus()).toBe(OrderStatus.Cancelled);
    });

    it('cannot cancel an order that is already Approved', () => {
      const order = createPendingOrder();
      order.approve(changedAt);

      expect(() => order.cancel(changedAt)).toThrow(InvalidTransitionError);
    });
  });

  describe('dispatch', () => {
    it('changes an Approved order to Dispatched', () => {
      const order = createPendingOrder();
      order.approve(changedAt);

      order.dispatch(changedAt);

      expect(order.getStatus()).toBe(OrderStatus.Dispatched);
    });

    it('cannot dispatch an order that is still Pending', () => {
      const order = createPendingOrder();

      expect(() => order.dispatch(changedAt)).toThrow(InvalidTransitionError);
    });
  });

  describe('final statuses', () => {
    it('cannot approve a Cancelled order', () => {
      const order = createPendingOrder();
      order.cancel(changedAt);

      expect(() => order.approve(changedAt)).toThrow(InvalidTransitionError);
    });

    it('cannot approve a Rejected order', () => {
      const order = createPendingOrder();
      order.reject('Credit under review', changedAt);

      expect(() => order.approve(changedAt)).toThrow(InvalidTransitionError);
    });

    it('cannot cancel a Dispatched order', () => {
      const order = createPendingOrder();
      order.approve(changedAt);
      order.dispatch(changedAt);

      expect(() => order.cancel(changedAt)).toThrow(InvalidTransitionError);
    });
  });
});
