import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { OrderLineOrmEntity } from './order-line.orm-entity';

@Entity('orders')
export class OrderOrmEntity {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Index()
  @Column({ name: 'distributor_id', type: 'varchar' })
  distributorId: string;

  @Column({ name: 'delivery_date', type: 'timestamptz' })
  deliveryDate: Date;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Index()
  @Column({ type: 'varchar' })
  status: string;

  @Column({ name: 'status_changed_at', type: 'timestamptz', nullable: true })
  statusChangedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'varchar', nullable: true })
  rejectionReason: string | null;

  // cascade: saving the order also saves its lines.
  // eager: reading the order also reads its lines.
  @OneToMany(() => OrderLineOrmEntity, (line) => line.order, {
    cascade: true,
    eager: true,
  })
  lines: OrderLineOrmEntity[];
}
