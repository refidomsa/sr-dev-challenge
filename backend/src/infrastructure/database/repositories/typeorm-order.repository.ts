import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Order } from '../../../domain/entities/order';
import { OrderLine } from '../../../domain/entities/order-line';
import { OrderStatus } from '../../../domain/entities/order-status';
import { ProductId } from '../../../domain/entities/product';
import {
  OrderRepository,
  OrderSearch,
  OrderSearchResult,
} from '../../../domain/repositories/order.repository';
import { OrderLineOrmEntity } from '../entities/order-line.orm-entity';
import { OrderOrmEntity } from '../entities/order.orm-entity';

@Injectable()
export class TypeOrmOrderRepository implements OrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly repository: Repository<OrderOrmEntity>,
  ) { }

  async findById(id: string): Promise<Order | null> {
    const row = await this.repository.findOneBy({ id: id });
    if (row === null) {
      return null;
    }
    return this.toDomain(row);
  }

  async findByDistributor(distributorId: string): Promise<Order[]> {
    const rows = await this.repository.findBy({ distributorId: distributorId });
    return this.toDomainList(rows);
  }

  async search(search: OrderSearch): Promise<OrderSearchResult> {
    // 1. Build the filters. A filter with the value null is not applied.
    const where: FindOptionsWhere<OrderOrmEntity> = {};

    if (search.distributorId !== null) {
      where.distributorId = search.distributorId;
    }

    if (search.status !== null) {
      where.status = search.status;
    }

    const hasFrom = search.deliveryFrom !== null;
    const hasTo = search.deliveryTo !== null;
    if (hasFrom && hasTo) {
      where.deliveryDate = Between(search.deliveryFrom!, search.deliveryTo!);
    }
    if (hasFrom && !hasTo) {
      where.deliveryDate = MoreThanOrEqual(search.deliveryFrom!);
    }
    if (!hasFrom && hasTo) {
      where.deliveryDate = LessThanOrEqual(search.deliveryTo!);
    }

    // 2. Ask for one page, newest first, and the total of all the pages
    const [rows, total] = await this.repository.findAndCount({
      where: where,
      order: { createdAt: 'DESC' },
      skip: (search.page - 1) * search.pageSize,
      take: search.pageSize,
    });

    return {
      orders: this.toDomainList(rows),
      total: total,
    };
  }

  async save(order: Order): Promise<void> {
    await this.repository.save(this.toRow(order));
  }

  private toDomainList(rows: OrderOrmEntity[]): Order[] {
    const orders: Order[] = [];
    for (const row of rows) {
      orders.push(this.toDomain(row));
    }
    return orders;
  }

  // Turns the rows of the tables into the Order of the domain.
  private toDomain(row: OrderOrmEntity): Order {
    const lines: OrderLine[] = [];
    for (const lineRow of row.lines) {
      lines.push(
        new OrderLine(
          lineRow.productId as ProductId,
          lineRow.gallons,
          lineRow.unitPriceCents,
        ),
      );
    }

    const order = new Order(
      row.id,
      row.distributorId,
      lines,
      row.deliveryDate,
      row.createdAt,
    );

    // A new Order is always Pending: put back the status it had when it was saved.
    order.restoreStatus(
      row.status as OrderStatus,
      row.statusChangedAt,
      row.rejectionReason,
    );

    return order;
  }

  // Turns the Order of the domain into the rows of the tables.
  private toRow(order: Order): OrderOrmEntity {
    const row = new OrderOrmEntity();
    row.id = order.id;
    row.distributorId = order.distributor;
    row.deliveryDate = order.deliveryDate;
    row.createdAt = order.createdAt;
    row.status = order.getStatus();
    row.statusChangedAt = order.getStatusChangedAt();
    row.rejectionReason = order.getRejectionReason();

    row.lines = [];
    for (const line of order.lines) {
      const lineRow = new OrderLineOrmEntity();
      lineRow.orderId = order.id;
      lineRow.productId = line.productId;
      lineRow.gallons = line.gallons;
      lineRow.unitPriceCents = line.unitPriceCents;
      row.lines.push(lineRow);
    }

    return row;
  }
}
