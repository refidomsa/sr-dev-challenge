import { Order } from '../entities/order';
import { OrderLine } from '../entities/order-line';
import { OrderStatus } from '../entities/order-status';
import { ProductId, ProductName } from '../entities/product';
import { DeliveryTooSoonError } from '../errors/delivery-too-soon.error';
import { DuplicateProductError } from '../errors/duplicate-product.error';
import { InvalidLineCountError } from '../errors/invalid-line-count.error';
import { MaximumGallonsError } from '../errors/maximum-gallons.error';
import { SundayDeliveryError } from '../errors/sunday-delivery.error';

describe('Order', () => {
  const createdAt = new Date('2026-10-08T14:00:00Z');

  const validDeliveryDate = new Date('2026-10-09T14:00:00Z');

  // RD$290.10 per gallon
  const premiumLine = new OrderLine(ProductId.PremiumGasoline, 500, 29010);
  // RD$270.50 per gallon
  const regularLine = new OrderLine(ProductId.RegularGasoline, 1000, 27050);

  describe('a valid order', () => {
    it('starts in Pending status', () => {
      const order = new Order(
        'order-1',
        'distributor-1',
        [premiumLine],
        validDeliveryDate,
        createdAt,
      );

      expect(order.getStatus()).toBe(OrderStatus.Pending);
    });

    it('adds the gallons of all its lines', () => {
      const order = new Order(
        'order-1',
        'distributor-1',
        [premiumLine, regularLine],
        validDeliveryDate,
        createdAt,
      );

      // 500 + 1000
      expect(order.getTotalGallons()).toBe(1500);
    });

    it('adds the subtotal of all its lines', () => {
      const order = new Order(
        'order-1',
        'distributor-1',
        [premiumLine, regularLine],
        validDeliveryDate,
        createdAt,
      );

      // 500 x RD$290.10 = RD$145,050.00
      // 1000 x RD$270.50 = RD$270,500.00
      // Total: RD$415,550.00
      expect(order.getTotalPay()).toBe(41555000);
    });
  });

  describe('number of lines', () => {
    it('accepts 1 line, the minimum', () => {
      const order = new Order(
        'order-1',
        'distributor-1',
        [premiumLine],
        validDeliveryDate,
        createdAt,
      );

      expect(order.lines.length).toBe(1);
    });

    it('accepts 4 lines, the maximum', () => {
      const lines = [
        new OrderLine(ProductId.OptimumDiesel, 500, 29010),
        new OrderLine(ProductId.PremiumGasoline, 500, 27050),
        new OrderLine(ProductId.RegularDiesel, 500, 24000),
        new OrderLine(ProductId.RegularGasoline, 500, 22000),
      ];

      const order = new Order(
        'order-1',
        'distributor-1',
        lines,
        validDeliveryDate,
        createdAt,
      );

      expect(order.lines.length).toBe(4);
    });

    it('rejects an order without lines', () => {
      const createOrder = () =>
        new Order('order-1', 'distributor-1', [], validDeliveryDate, createdAt);

      expect(createOrder).toThrow(InvalidLineCountError);
    });

    it('rejects 5 lines', () => {
      const lines = [
        new OrderLine(ProductId.PremiumGasoline, 500, 29010),
        new OrderLine(ProductId.OptimumDiesel, 500, 27050),
        new OrderLine(ProductId.RegularDiesel, 500, 24000),
        new OrderLine(ProductId.PremiumGasoline, 500, 22000),
        new OrderLine(ProductId.OptimumDiesel, 500, 20000),
      ];

      const createOrder = () =>
        new Order(
          'order-1',
          'distributor-1',
          lines,
          validDeliveryDate,
          createdAt,
        );

      expect(createOrder).toThrow(InvalidLineCountError);
    });
  });

  describe('repeated products', () => {
    it('rejects two lines with the same product', () => {
      const lines = [
        new OrderLine(ProductId.PremiumGasoline, 500, 29010),
        new OrderLine(ProductId.PremiumGasoline, 700, 29010),
      ];

      const createOrder = () =>
        new Order(
          'order-1',
          'distributor-1',
          lines,
          validDeliveryDate,
          createdAt,
        );

      expect(createOrder).toThrow(DuplicateProductError);
    });
  });

  describe('total gallons', () => {
    it('accepts exactly 9,000 gallons, the maximum', () => {
      const lines = [
        new OrderLine(ProductId.PremiumGasoline, 4500, 29010),
        new OrderLine(ProductId.OptimumDiesel, 4500, 27050),
      ];

      const order = new Order(
        'order-1',
        'distributor-1',
        lines,
        validDeliveryDate,
        createdAt,
      );

      expect(order.getTotalGallons()).toBe(9000);
    });

    it('rejects 9,001 gallons', () => {
      const lines = [
        new OrderLine(ProductId.PremiumGasoline, 4500, 29010),
        new OrderLine(ProductId.OptimumDiesel, 4501, 27050),
      ];

      const createOrder = () =>
        new Order(
          'order-1',
          'distributor-1',
          lines,
          validDeliveryDate,
          createdAt,
        );

      expect(createOrder).toThrow(MaximumGallonsError);
    });
  });

  describe('delivery date: at least 24 hours later', () => {
    it('accepts a delivery exactly 24 hours after creation', () => {
      const exactly24HoursLater = new Date('2026-10-09T14:00:00Z');

      const order = new Order(
        'order-1',
        'distributor-1',
        [premiumLine],
        exactly24HoursLater,
        createdAt,
      );

      expect(order.deliveryDate).toBe(exactly24HoursLater);
    });

    it('rejects a delivery 23 hours and 59 minutes after creation', () => {
      const oneMinuteTooSoon = new Date('2026-10-09T13:59:00Z');

      const createOrder = () =>
        new Order(
          'order-1',
          'distributor-1',
          [premiumLine],
          oneMinuteTooSoon,
          createdAt,
        );

      expect(createOrder).toThrow(DeliveryTooSoonError);
    });

    it('rejects a delivery date before the creation date', () => {
      const yesterday = new Date('2026-10-07T14:00:00Z');

      const createOrder = () =>
        new Order(
          'order-1',
          'distributor-1',
          [premiumLine],
          yesterday,
          createdAt,
        );

      expect(createOrder).toThrow(DeliveryTooSoonError);
    });
  });

  describe('delivery date: never on Sunday', () => {
    it('accepts a delivery on Saturday', () => {
      // Saturday, October 10, 2026 at 12:00 in Dominican time
      const saturdayNoon = new Date('2026-10-10T16:00:00Z');

      const order = new Order(
        'order-1',
        'distributor-1',
        [premiumLine],
        saturdayNoon,
        createdAt,
      );

      expect(order.deliveryDate).toBe(saturdayNoon);
    });

    it('rejects a delivery on Sunday', () => {
      // Sunday, October 11, 2026 at 12:00 in Dominican time
      const sundayNoon = new Date('2026-10-11T16:00:00Z');

      const createOrder = () =>
        new Order(
          'order-1',
          'distributor-1',
          [premiumLine],
          sundayNoon,
          createdAt,
        );

      expect(createOrder).toThrow(SundayDeliveryError);
    });

    it('accepts a delivery on Monday', () => {
      // Monday, October 12, 2026 at 12:00 in Dominican time
      const mondayNoon = new Date('2026-10-12T16:00:00Z');

      const order = new Order(
        'order-1',
        'distributor-1',
        [premiumLine],
        mondayNoon,
        createdAt,
      );

      expect(order.deliveryDate).toBe(mondayNoon);
    });

    it('accepts Saturday night in Dominican time, even if it is already Sunday in UTC', () => {
      // Saturday at 23:00 in Dominican time is Sunday at 03:00 in UTC
      const saturdayNight = new Date('2026-10-11T03:00:00Z');

      const order = new Order(
        'order-1',
        'distributor-1',
        [premiumLine],
        saturdayNight,
        createdAt,
      );

      expect(order.deliveryDate).toBe(saturdayNight);
    });

    it('rejects Sunday night in Dominican time, even if it is already Monday in UTC', () => {
      // Sunday at 22:00 in Dominican time is Monday at 02:00 in UTC
      const sundayNight = new Date('2026-10-12T02:00:00Z');

      const createOrder = () =>
        new Order(
          'order-1',
          'distributor-1',
          [premiumLine],
          sundayNight,
          createdAt,
        );

      expect(createOrder).toThrow(SundayDeliveryError);
    });
  });
});
