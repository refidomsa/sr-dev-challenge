import { Inject, Injectable } from '@nestjs/common';
import { Order } from '../../domain/entities/order';
import { OrderLine } from '../../domain/entities/order-line';
import { ProductId } from '../../domain/entities/product';
import { User } from '../../domain/entities/user';
import {
  DISTRIBUTOR_REPOSITORY,
  type DistributorRepository,
} from '../../domain/repositories/distributor.repository';
import {
  ORDER_REPOSITORY,
  type OrderRepository,
} from '../../domain/repositories/order.repository';
import {
  PRODUCT_REPOSITORY,
  type ProductRepository,
} from '../../domain/repositories/product.repository';
import { CLOCK, type Clock } from '../ports/clock';
import { ID_GENERATOR, type IdGenerator } from '../ports/id-generator';
import { ForbiddenActionError } from '../errors/forbidden-action.error';
import { DistributorNotFoundError } from '../errors/distributor-not-found.error';
import { ProductNotFoundError } from '../errors/product-not-found.error';

export interface CreateOrderLineInput {
  productId: ProductId;
  gallons: number;
}

export interface CreateOrderInput {
  // The user who is logged in and making the request.
  user: User;
  lines: CreateOrderLineInput[];
  deliveryDate: Date;
}

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(DISTRIBUTOR_REPOSITORY)
    private readonly distributorRepository: DistributorRepository,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(CLOCK)
    private readonly clock: Clock,
    @Inject(ID_GENERATOR)
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    // Permission: only a Distributor can create orders, and only for its own distributor
    const distributorId = input.user.distributorId;
    if (!input.user.isDistributor() || distributorId === null) {
      throw new ForbiddenActionError('Only distributors can create orders');
    }

    const distributor =
      await this.distributorRepository.findById(distributorId);
    if (distributor === null) {
      throw new DistributorNotFoundError(distributorId);
    }

    //El precio de cada línea se fija al momento de crear el pedido
    const lines: OrderLine[] = [];
    for (const lineInput of input.lines) {
      const product = await this.productRepository.findById(
        lineInput.productId,
      );
      if (product === null) {
        throw new ProductNotFoundError(lineInput.productId);
      }

      const line = new OrderLine(
        product.id,
        lineInput.gallons,
        product.pricePerGallonCents,
      );
      lines.push(line);
    }

    // Creating the order checks rules 1, 2 and 3
    const order = new Order(
      this.idGenerator.generate(),
      distributor.id,
      lines,
      input.deliveryDate,
      this.clock.now(),
    );

    //El pedido debe ajustarse al crédito disponible
    const existingOrders = await this.orderRepository.findByDistributor(
      distributor.id,
    );
    distributor.assertHasCreditFor(order, existingOrders);

    await this.orderRepository.save(order);

    return order;
  }
}
