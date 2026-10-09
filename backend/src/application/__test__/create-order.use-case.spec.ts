import { Distributor } from '../../domain/entities/distributor';
import { OrderStatus } from '../../domain/entities/order-status';
import { Product, ProductId, ProductName } from '../../domain/entities/product';
import { User, UserRole } from '../../domain/entities/user';
import { InsufficientCreditError } from '../../domain/errors/insufficient-credit.error';
import { MinimumGallonsError } from '../../domain/errors/minimum-gallons.error';
import { SundayDeliveryError } from '../../domain/errors/sunday-delivery.error';
import { DistributorNotFoundError } from '../errors/distributor-not-found.error';
import { ForbiddenActionError } from '../errors/forbidden-action.error';
import { ProductNotFoundError } from '../errors/product-not-found.error';
import { CreateOrderUseCase } from '../use-cases/create-order.use-case';
import { FixedClock } from './fakes/fixed-clock';
import { InMemoryDistributorRepository } from './fakes/in-memory-distributor.repository';
import { InMemoryOrderRepository } from './fakes/in-memory-order.repository';
import { InMemoryProductRepository } from './fakes/in-memory-product.repository';
import { SequentialIdGenerator } from './fakes/sequential-id-generator';

// All dates are written in UTC. Dominican time is 4 hours behind.
// Thursday, October 8, 2026 at 10:00 in Dominican time
const now = new Date('2026-10-08T14:00:00Z');
// Friday, October 9, 2026 at 10:00 in Dominican time
const deliveryDate = new Date('2026-10-09T14:00:00Z');
// Sunday, October 11, 2026 at 12:00 in Dominican time
const sunday = new Date('2026-10-11T16:00:00Z');

// 500 gallons x RD$290.10 = RD$145,050.00
const TOTAL_OF_500_PREMIUM_GALLONS = 14505000;

describe('CreateOrderUseCase', () => {
  let productRepository: InMemoryProductRepository;
  let distributorRepository: InMemoryDistributorRepository;
  let orderRepository: InMemoryOrderRepository;
  let createOrder: CreateOrderUseCase;

  let distributorUser: User;
  let operatorUser: User;

  // This runs before every test, so each one starts with clean data.
  beforeEach(() => {
    productRepository = new InMemoryProductRepository();
    productRepository.products = [
      // RD$290.10 per gallon
      new Product(
        ProductId.PremiumGasoline,
        ProductName.PremiumGasoline,
        29010,
      ),
      // RD$270.50 per gallon
      new Product(
        ProductId.RegularGasoline,
        ProductName.RegularGasoline,
        27050,
      ),
    ];

    distributorRepository = new InMemoryDistributorRepository();
    distributorRepository.distributors = [
      // Credit limit: RD$1,000,000.00
      new Distributor(
        'distributor-1',
        'Estación Los Prados',
        '101234567',
        100000000,
      ),
    ];

    orderRepository = new InMemoryOrderRepository();

    createOrder = new CreateOrderUseCase(
      productRepository,
      distributorRepository,
      orderRepository,
      new FixedClock(now),
      new SequentialIdGenerator(),
    );

    distributorUser = new User(
      'user-1',
      'Ana Pérez',
      'ana@losprados.com',
      'hashed-password',
      UserRole.Distributor,
      'distributor-1',
    );

    operatorUser = new User(
      'user-2',
      'Luis Gómez',
      'luis@refidomsa.com',
      'hashed-password',
      UserRole.Operator,
      null,
    );
  });

  describe('a valid order', () => {
    it('is created in Pending status', async () => {
      const order = await createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 500 }],
        deliveryDate: deliveryDate,
      });

      expect(order.getStatus()).toBe(OrderStatus.Pending);
    });

    it('belongs to the distributor of the user', async () => {
      const order = await createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 500 }],
        deliveryDate: deliveryDate,
      });

      expect(order.distributor).toBe('distributor-1');
    });

    it('takes the current price of each product', async () => {
      const order = await createOrder.execute({
        user: distributorUser,
        lines: [
          { productId: ProductId.PremiumGasoline, gallons: 500 },
          { productId: ProductId.RegularGasoline, gallons: 1000 },
        ],
        deliveryDate: deliveryDate,
      });

      expect(order.lines[0].unitPriceCents).toBe(29010);
      expect(order.lines[1].unitPriceCents).toBe(27050);
    });

    it('uses the clock for the creation date', async () => {
      const order = await createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 500 }],
        deliveryDate: deliveryDate,
      });

      expect(order.createdAt).toBe(now);
    });

    it('is saved', async () => {
      const order = await createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 500 }],
        deliveryDate: deliveryDate,
      });

      const savedOrder = await orderRepository.findById(order.id);
      expect(savedOrder).toBe(order);
    });
  });

  describe('permissions', () => {
    it('does not let an operator create an order', async () => {
      const attempt = createOrder.execute({
        user: operatorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 500 }],
        deliveryDate: deliveryDate,
      });

      await expect(attempt).rejects.toThrow(ForbiddenActionError);
    });
  });

  describe('data that does not exist', () => {
    it('rejects a product that does not exist', async () => {
      // Regular diesel is a valid id, but it was not loaded in this test
      const attempt = createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.RegularDiesel, gallons: 500 }],
        deliveryDate: deliveryDate,
      });

      await expect(attempt).rejects.toThrow(ProductNotFoundError);
    });

    it('rejects a user whose distributor does not exist', async () => {
      distributorRepository.distributors = [];

      const attempt = createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 500 }],
        deliveryDate: deliveryDate,
      });

      await expect(attempt).rejects.toThrow(DistributorNotFoundError);
    });
  });

  describe('business rules', () => {
    it('rejects a line with less than 500 gallons', async () => {
      const attempt = createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 499 }],
        deliveryDate: deliveryDate,
      });

      await expect(attempt).rejects.toThrow(MinimumGallonsError);
    });

    it('rejects a delivery on Sunday', async () => {
      const attempt = createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 500 }],
        deliveryDate: sunday,
      });

      await expect(attempt).rejects.toThrow(SundayDeliveryError);
    });

    it('does not save an order that breaks a rule', async () => {
      const attempt = createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 500 }],
        deliveryDate: sunday,
      });

      await expect(attempt).rejects.toThrow();
      expect(orderRepository.orders.length).toBe(0);
    });
  });

  describe('credit', () => {
    beforeEach(() => {
      // In these tests the credit limit covers exactly one order
      distributorRepository.distributors = [
        new Distributor(
          'distributor-1',
          'Estación Los Prados',
          '101234567',
          TOTAL_OF_500_PREMIUM_GALLONS,
        ),
      ];
    });

    it('accepts an order that costs exactly the available credit', async () => {
      const order = await createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 500 }],
        deliveryDate: deliveryDate,
      });

      expect(order.getTotalPay()).toBe(TOTAL_OF_500_PREMIUM_GALLONS);
    });

    it('rejects an order that costs more than the available credit', async () => {
      const attempt = createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 501 }],
        deliveryDate: deliveryDate,
      });

      await expect(attempt).rejects.toThrow(InsufficientCreditError);
    });

    it('rejects a second order when the first one already used the credit', async () => {
      await createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 500 }],
        deliveryDate: deliveryDate,
      });

      const secondAttempt = createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 500 }],
        deliveryDate: deliveryDate,
      });

      await expect(secondAttempt).rejects.toThrow(InsufficientCreditError);
    });

    it('does not save an order without enough credit', async () => {
      const attempt = createOrder.execute({
        user: distributorUser,
        lines: [{ productId: ProductId.PremiumGasoline, gallons: 501 }],
        deliveryDate: deliveryDate,
      });

      await expect(attempt).rejects.toThrow();
      expect(orderRepository.orders.length).toBe(0);
    });
  });
});
