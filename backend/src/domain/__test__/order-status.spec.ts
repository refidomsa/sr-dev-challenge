import { InvalidTransitionError } from '../errors/invalid-transition.error';
import {
  OrderStatus,
  assertTransition,
  canTransition,
} from '../entities/order-status';

describe('OrderStatus transitions', () => {
  describe('from Pending', () => {
    it('can change to Approved', () => {
      expect(canTransition(OrderStatus.Pending, OrderStatus.Approved)).toBe(
        true,
      );
    });

    it('can change to Rejected', () => {
      expect(canTransition(OrderStatus.Pending, OrderStatus.Rejected)).toBe(
        true,
      );
    });

    it('can change to Cancelled', () => {
      expect(canTransition(OrderStatus.Pending, OrderStatus.Cancelled)).toBe(
        true,
      );
    });

    it('cannot change to Dispatched without being approved first', () => {
      expect(canTransition(OrderStatus.Pending, OrderStatus.Dispatched)).toBe(
        false,
      );
    });

    it('cannot change to Pending again', () => {
      expect(canTransition(OrderStatus.Pending, OrderStatus.Pending)).toBe(
        false,
      );
    });
  });

  describe('from Approved', () => {
    it('can change to Dispatched', () => {
      expect(canTransition(OrderStatus.Approved, OrderStatus.Dispatched)).toBe(
        true,
      );
    });

    it('cannot change to Cancelled', () => {
      expect(canTransition(OrderStatus.Approved, OrderStatus.Cancelled)).toBe(
        false,
      );
    });

    it('cannot change to Rejected', () => {
      expect(canTransition(OrderStatus.Approved, OrderStatus.Rejected)).toBe(
        false,
      );
    });

    it('cannot change to Pending', () => {
      expect(canTransition(OrderStatus.Approved, OrderStatus.Pending)).toBe(
        false,
      );
    });

    it('cannot change to Approved again', () => {
      expect(canTransition(OrderStatus.Approved, OrderStatus.Approved)).toBe(
        false,
      );
    });
  });

  describe('final statuses', () => {
    const everyStatus = Object.values(OrderStatus);

    it('Dispatched cannot change to any status', () => {
      for (const next of everyStatus) {
        expect(canTransition(OrderStatus.Dispatched, next)).toBe(false);
      }
      expect(canTransition(OrderStatus.Dispatched, OrderStatus.Approved)).toBe(
        false,
      );
    });

    it('Rejected cannot change to any status', () => {
      for (const next of everyStatus) {
        expect(canTransition(OrderStatus.Rejected, next)).toBe(false);
      }
    });

    it('Cancelled cannot change to any status', () => {
      for (const next of everyStatus) {
        expect(canTransition(OrderStatus.Cancelled, next)).toBe(false);
      }
    });
  });

  describe('assertTransition', () => {
    it('does nothing when the transition is allowed', () => {
      expect(() =>
        assertTransition(OrderStatus.Pending, OrderStatus.Approved),
      ).not.toThrow();
    });

    it('throws InvalidTransitionError when the transition is not allowed', () => {
      expect(() =>
        assertTransition(OrderStatus.Approved, OrderStatus.Cancelled),
      ).toThrow(InvalidTransitionError);
    });

    it('throws invalidTransitionError whe the transaiction is not allowed  dispatched to approved', () => {
      expect(() =>
        assertTransition(OrderStatus.Dispatched, OrderStatus.Approved),
      ).toThrow(InvalidTransitionError);
    });
  });
});
