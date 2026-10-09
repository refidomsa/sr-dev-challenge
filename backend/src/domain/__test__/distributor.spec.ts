import { Distributor } from '../entities/distributor';
import { Order } from '../entities/order';
import { OrderLine } from '../entities/order-line';
import { ProductId } from '../entities/product';
import { InsufficientCreditError } from '../errors/insufficient-credit.error';
import { InvalidCreditLimitError } from '../errors/invalid-credit-limit.error';

const createdAt = new Date('2026-10-08T14:00:00Z');
const deliveryDate = new Date('2026-10-09T14:00:00Z');
const changedAt = new Date('2026-10-08T19:00:00Z');

const ORDER_TOTAL = 14505000;

function createOrder(orderId: string, distributorId: string): Order {
  const line = new OrderLine(ProductId.PremiumGasoline, 500, 29010);

  return new Order(orderId, distributorId, [line], deliveryDate, createdAt);
}

describe('Distributor', () => {
  it('keeps its id, name, RNC and credit limit', () => {
    const distributor = new Distributor(
      'distributor-1',
      'Estación Los Prados',
      '101234567',
      100000000,
    );

    expect(distributor.id).toBe('distributor-1');
    expect(distributor.name).toBe('Estación Los Prados');
    expect(distributor.rnc).toBe('101234567');
    expect(distributor.creditLimitCents).toBe(100000000);
  });

  describe('credit limit', () => {
    it('accepts a credit limit of 0', () => {
      const distributor = new Distributor(
        'distributor-1',
        'Estación Los Prados',
        '101234567',
        0,
      );

      expect(distributor.creditLimitCents).toBe(0);
    });

    it('rejects a negative credit limit', () => {
      const createDistributor = () =>
        new Distributor(
          'distributor-1',
          'Estación Los Prados',
          '101234567',
          -1,
        );

      expect(createDistributor).toThrow(InvalidCreditLimitError);
    });

    it('rejects a credit limit written in pesos instead of cents', () => {
      const createDistributor = () =>
        new Distributor(
          'distributor-1',
          'Estación Los Prados',
          '101234567',
          1000000.5,
        );

      expect(createDistributor).toThrow(InvalidCreditLimitError);
    });
  });

  describe('available credit', () => {
    // Credit limit: RD$1,000,000.00
    const distributor = new Distributor(
      'distributor-1',
      'Estación Los Prados',
      '101234567',
      100000000,
    );

    it('is the whole credit limit when there are no orders', () => {
      expect(distributor.getAvailableCredit([])).toBe(100000000);
    });

    it('goes down with a Pending order', () => {
      const pendingOrder = createOrder('order-1', 'distributor-1');

      const availableCredit = distributor.getAvailableCredit([pendingOrder]);

      expect(availableCredit).toBe(100000000 - ORDER_TOTAL);
    });

    it('stays down when the order is Approved', () => {
      const approvedOrder = createOrder('order-1', 'distributor-1');
      approvedOrder.approve(changedAt);

      const availableCredit = distributor.getAvailableCredit([approvedOrder]);

      expect(availableCredit).toBe(100000000 - ORDER_TOTAL);
    });

    it('comes back when the order is Cancelled', () => {
      const cancelledOrder = createOrder('order-1', 'distributor-1');
      cancelledOrder.cancel(changedAt);

      const availableCredit = distributor.getAvailableCredit([cancelledOrder]);

      expect(availableCredit).toBe(100000000);
    });

    it('comes back when the order is Rejected', () => {
      const rejectedOrder = createOrder('order-1', 'distributor-1');
      rejectedOrder.reject('Credit under review', changedAt);

      const availableCredit = distributor.getAvailableCredit([rejectedOrder]);

      expect(availableCredit).toBe(100000000);
    });

    it('comes back when the order is Dispatched', () => {
      const dispatchedOrder = createOrder('order-1', 'distributor-1');
      dispatchedOrder.approve(changedAt);
      dispatchedOrder.dispatch(changedAt);

      const availableCredit = distributor.getAvailableCredit([dispatchedOrder]);

      expect(availableCredit).toBe(100000000);
    });

    it('adds up several orders', () => {
      const firstOrder = createOrder('order-1', 'distributor-1');
      const secondOrder = createOrder('order-2', 'distributor-1');

      const availableCredit = distributor.getAvailableCredit([
        firstOrder,
        secondOrder,
      ]);

      expect(availableCredit).toBe(100000000 - ORDER_TOTAL - ORDER_TOTAL);
    });

    it('ignores the orders of another distributor', () => {
      const orderFromAnotherDistributor = createOrder(
        'order-1',
        'distributor-2',
      );

      const availableCredit = distributor.getAvailableCredit([
        orderFromAnotherDistributor,
      ]);

      expect(availableCredit).toBe(100000000);
    });
  });

  describe('credit for a new order', () => {
    it('accepts an order that costs exactly the available credit', () => {
      const distributor = new Distributor(
        'distributor-1',
        'Estación Los Prados',
        '101234567',
        ORDER_TOTAL,
      );
      const newOrder = createOrder('order-1', 'distributor-1');

      expect(() => distributor.assertHasCreditFor(newOrder, [])).not.toThrow();
    });

    it('rejects an order that costs 1 cent more than the available credit', () => {
      const distributor = new Distributor(
        'distributor-1',
        'Estación Los Prados',
        '101234567',
        ORDER_TOTAL - 1,
      );
      const newOrder = createOrder('order-1', 'distributor-1');

      expect(() => distributor.assertHasCreditFor(newOrder, [])).toThrow(
        InsufficientCreditError,
      );
    });

    it('counts the orders that are already using credit', () => {
      // The credit limit covers exactly one order
      const distributor = new Distributor(
        'distributor-1',
        'Estación Los Prados',
        '101234567',
        ORDER_TOTAL,
      );
      const existingOrder = createOrder('order-1', 'distributor-1');
      const newOrder = createOrder('order-2', 'distributor-1');

      expect(() =>
        distributor.assertHasCreditFor(newOrder, [existingOrder]),
      ).toThrow(InsufficientCreditError);
    });

    it('accepts the new order once the existing one is Cancelled', () => {
      const distributor = new Distributor(
        'distributor-1',
        'Estación Los Prados',
        '101234567',
        ORDER_TOTAL,
      );
      const existingOrder = createOrder('order-1', 'distributor-1');
      existingOrder.cancel(changedAt);
      const newOrder = createOrder('order-2', 'distributor-1');

      expect(() =>
        distributor.assertHasCreditFor(newOrder, [existingOrder]),
      ).not.toThrow();
    });

    it('tells the order total and the available credit in the error', () => {
      const error = new InsufficientCreditError(14505000, 10000000);

      expect(error.code).toBe('INSUFFICIENT_CREDIT');
      expect(error.orderTotalCents).toBe(14505000);
      expect(error.availableCreditCents).toBe(10000000);
    });
  });
});
