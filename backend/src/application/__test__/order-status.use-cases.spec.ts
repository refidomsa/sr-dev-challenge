import { Order } from '../../domain/entities/order';
import { OrderLine } from '../../domain/entities/order-line';
import { OrderStatus } from '../../domain/entities/order-status';
import { ProductId } from '../../domain/entities/product';
import { User, UserRole } from '../../domain/entities/user';
import { InvalidTransitionError } from '../../domain/errors/invalid-transition.error';
import { RejectionReasonRequiredError } from '../../domain/errors/rejection-reason-required.error';
import { ForbiddenActionError } from '../errors/forbidden-action.error';
import { OrderNotFoundError } from '../errors/order-not-found.error';
import { ApproveOrderUseCase } from '../use-cases/approve-order.use-case';
import { CancelOrderUseCase } from '../use-cases/cancel-order.use-case';
import { DispatchOrderUseCase } from '../use-cases/dispatch-order.use-case';
import { RejectOrderUseCase } from '../use-cases/reject-order.use-case';
import { FixedClock } from './fakes/fixed-clock';
import { InMemoryOrderRepository } from './fakes/in-memory-order.repository';

// All dates are written in UTC. Dominican time is 4 hours behind.
// Thursday, October 8, 2026 at 10:00 in Dominican time
const createdAt = new Date('2026-10-08T14:00:00Z');
// Friday, October 9, 2026 at 10:00 in Dominican time
const deliveryDate = new Date('2026-10-09T14:00:00Z');
// Thursday, October 8, 2026 at 15:00 in Dominican time
const now = new Date('2026-10-08T19:00:00Z');

describe('Order status use cases', () => {
  let orderRepository: InMemoryOrderRepository;
  let clock: FixedClock;

  let operatorUser: User;
  let distributorUser: User;
  let userOfAnotherDistributor: User;

  // This runs before every test.
  // Each test starts with one Pending order that belongs to distributor-1.
  beforeEach(async () => {
    orderRepository = new InMemoryOrderRepository();
    clock = new FixedClock(now);

    const line = new OrderLine(ProductId.PremiumGasoline, 500, 29010);
    const pendingOrder = new Order(
      'order-1',
      'distributor-1',
      [line],
      deliveryDate,
      createdAt,
    );
    await orderRepository.save(pendingOrder);

    operatorUser = new User(
      'user-1',
      'Luis Gómez',
      'luis@refidomsa.com',
      'hashed-password',
      UserRole.Operator,
      null,
    );

    distributorUser = new User(
      'user-2',
      'Ana Pérez',
      'ana@losprados.com',
      'hashed-password',
      UserRole.Distributor,
      'distributor-1',
    );

    userOfAnotherDistributor = new User(
      'user-3',
      'Carlos Díaz',
      'carlos@elcaribe.com',
      'hashed-password',
      UserRole.Distributor,
      'distributor-2',
    );
  });

  describe('approve', () => {
    let approveOrder: ApproveOrderUseCase;

    beforeEach(() => {
      approveOrder = new ApproveOrderUseCase(orderRepository, clock);
    });

    it('lets an operator approve a Pending order', async () => {
      const order = await approveOrder.execute({
        user: operatorUser,
        orderId: 'order-1',
      });

      expect(order.getStatus()).toBe(OrderStatus.Approved);
    });

    it('records when the order was approved', async () => {
      const order = await approveOrder.execute({
        user: operatorUser,
        orderId: 'order-1',
      });

      expect(order.getStatusChangedAt()).toBe(now);
    });

    it('saves the approved order', async () => {
      await approveOrder.execute({ user: operatorUser, orderId: 'order-1' });

      const savedOrder = await orderRepository.findById('order-1');
      expect(savedOrder?.getStatus()).toBe(OrderStatus.Approved);
    });

    it('does not let a distributor approve', async () => {
      const attempt = approveOrder.execute({
        user: distributorUser,
        orderId: 'order-1',
      });

      await expect(attempt).rejects.toThrow(ForbiddenActionError);
    });

    it('rejects an order that does not exist', async () => {
      const attempt = approveOrder.execute({
        user: operatorUser,
        orderId: 'order-999',
      });

      await expect(attempt).rejects.toThrow(OrderNotFoundError);
    });

    it('cannot approve an order twice', async () => {
      await approveOrder.execute({ user: operatorUser, orderId: 'order-1' });

      const secondAttempt = approveOrder.execute({
        user: operatorUser,
        orderId: 'order-1',
      });

      await expect(secondAttempt).rejects.toThrow(InvalidTransitionError);
    });
  });

  describe('reject', () => {
    let rejectOrder: RejectOrderUseCase;

    beforeEach(() => {
      rejectOrder = new RejectOrderUseCase(orderRepository, clock);
    });

    it('lets an operator reject a Pending order', async () => {
      const order = await rejectOrder.execute({
        user: operatorUser,
        orderId: 'order-1',
        reason: 'Credit under review',
      });

      expect(order.getStatus()).toBe(OrderStatus.Rejected);
    });

    it('keeps the reason', async () => {
      const order = await rejectOrder.execute({
        user: operatorUser,
        orderId: 'order-1',
        reason: 'Credit under review',
      });

      expect(order.getRejectionReason()).toBe('Credit under review');
    });

    it('requires a reason', async () => {
      const attempt = rejectOrder.execute({
        user: operatorUser,
        orderId: 'order-1',
        reason: '',
      });

      await expect(attempt).rejects.toThrow(RejectionReasonRequiredError);
    });

    it('does not let a distributor reject', async () => {
      const attempt = rejectOrder.execute({
        user: distributorUser,
        orderId: 'order-1',
        reason: 'Credit under review',
      });

      await expect(attempt).rejects.toThrow(ForbiddenActionError);
    });

    it('rejects an order that does not exist', async () => {
      const attempt = rejectOrder.execute({
        user: operatorUser,
        orderId: 'order-999',
        reason: 'Credit under review',
      });

      await expect(attempt).rejects.toThrow(OrderNotFoundError);
    });
  });

  describe('dispatch', () => {
    let approveOrder: ApproveOrderUseCase;
    let dispatchOrder: DispatchOrderUseCase;

    beforeEach(() => {
      approveOrder = new ApproveOrderUseCase(orderRepository, clock);
      dispatchOrder = new DispatchOrderUseCase(orderRepository, clock);
    });

    it('lets an operator dispatch an Approved order', async () => {
      await approveOrder.execute({ user: operatorUser, orderId: 'order-1' });

      const order = await dispatchOrder.execute({
        user: operatorUser,
        orderId: 'order-1',
      });

      expect(order.getStatus()).toBe(OrderStatus.Dispatched);
    });

    it('cannot dispatch an order that is still Pending', async () => {
      const attempt = dispatchOrder.execute({
        user: operatorUser,
        orderId: 'order-1',
      });

      await expect(attempt).rejects.toThrow(InvalidTransitionError);
    });

    it('does not let a distributor dispatch', async () => {
      const attempt = dispatchOrder.execute({
        user: distributorUser,
        orderId: 'order-1',
      });

      await expect(attempt).rejects.toThrow(ForbiddenActionError);
    });

    it('rejects an order that does not exist', async () => {
      const attempt = dispatchOrder.execute({
        user: operatorUser,
        orderId: 'order-999',
      });

      await expect(attempt).rejects.toThrow(OrderNotFoundError);
    });
  });

  describe('cancel', () => {
    let approveOrder: ApproveOrderUseCase;
    let cancelOrder: CancelOrderUseCase;

    beforeEach(() => {
      approveOrder = new ApproveOrderUseCase(orderRepository, clock);
      cancelOrder = new CancelOrderUseCase(orderRepository, clock);
    });

    it('lets a distributor cancel its own Pending order', async () => {
      const order = await cancelOrder.execute({
        user: distributorUser,
        orderId: 'order-1',
      });

      expect(order.getStatus()).toBe(OrderStatus.Cancelled);
    });

    it('does not let an operator cancel', async () => {
      const attempt = cancelOrder.execute({
        user: operatorUser,
        orderId: 'order-1',
      });

      await expect(attempt).rejects.toThrow(ForbiddenActionError);
    });

    it('answers "not found" for the order of another distributor', async () => {
      const attempt = cancelOrder.execute({
        user: userOfAnotherDistributor,
        orderId: 'order-1',
      });

      await expect(attempt).rejects.toThrow(OrderNotFoundError);
    });

    it('leaves the order of another distributor untouched', async () => {
      const attempt = cancelOrder.execute({
        user: userOfAnotherDistributor,
        orderId: 'order-1',
      });
      await expect(attempt).rejects.toThrow();

      const savedOrder = await orderRepository.findById('order-1');
      expect(savedOrder?.getStatus()).toBe(OrderStatus.Pending);
    });

    it('cannot cancel an order that is already Approved', async () => {
      await approveOrder.execute({ user: operatorUser, orderId: 'order-1' });

      const attempt = cancelOrder.execute({
        user: distributorUser,
        orderId: 'order-1',
      });

      await expect(attempt).rejects.toThrow(InvalidTransitionError);
    });

    it('rejects an order that does not exist', async () => {
      const attempt = cancelOrder.execute({
        user: distributorUser,
        orderId: 'order-999',
      });

      await expect(attempt).rejects.toThrow(OrderNotFoundError);
    });
  });
});
