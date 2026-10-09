import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { OrderOrmEntity } from './order.orm-entity';

// The key is order + product: the database itself does not allow
// the same product twice in one order (rule 1).
@Entity('order_lines')
export class OrderLineOrmEntity {
  @PrimaryColumn({ name: 'order_id', type: 'varchar' })
  orderId: string;

  @PrimaryColumn({ name: 'product_id', type: 'varchar' })
  productId: string;

  @Column({ type: 'integer' })
  gallons: number;

  // The price at the moment the order was created (rule 6).
  @Column({ name: 'unit_price_cents', type: 'integer' })
  unitPriceCents: number;

  @ManyToOne(() => OrderOrmEntity, (order) => order.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: OrderOrmEntity;
}
