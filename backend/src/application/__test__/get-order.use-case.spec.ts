import { OrderNotFoundError } from '../errors/order-not-found.error';
import { GetOrderUseCase } from '../use-cases/get-order.use-case';
import { InMemoryOrderRepository } from './fakes/in-memory-order.repository';
import {
  buildOrder,
  distributorUser,
  operatorUser,
  userOfAnotherDistributor,
} from './fakes/sample-data';

describe('GetOrderUseCase', () => {
  let getOrder: GetOrderUseCase;

  // Each test starts with one order that belongs to distributor-1.
  beforeEach(async () => {
    const orderRepository = new InMemoryOrderRepository();
    getOrder = new GetOrderUseCase(orderRepository);

    await orderRepository.save(
      buildOrder('order-1', 'distributor-1', '2026-10-08', '2026-10-09'),
    );
  });

  it('shows any order to an operator', async () => {
    const order = await getOrder.execute({
      user: operatorUser,
      orderId: 'order-1',
    });

    expect(order.id).toBe('order-1');
  });

  it('shows a distributor its own order', async () => {
    const order = await getOrder.execute({
      user: distributorUser,
      orderId: 'order-1',
    });

    expect(order.id).toBe('order-1');
  });

  it('answers "not found" for the order of another distributor', async () => {
    const action = getOrder.execute({
      user: userOfAnotherDistributor,
      orderId: 'order-1',
    });

    await expect(action).rejects.toThrow(OrderNotFoundError);
  });

  it('answers "not found" when the order does not exist', async () => {
    const action = getOrder.execute({
      user: operatorUser,
      orderId: 'order-999',
    });

    await expect(action).rejects.toThrow(OrderNotFoundError);
  });
});
