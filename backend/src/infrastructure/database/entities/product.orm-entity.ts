import { Column, Entity, PrimaryColumn } from 'typeorm';

// The "products" table. It only describes columns: the rules live in domain/.
@Entity('products')
export class ProductOrmEntity {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'price_per_gallon_cents', type: 'integer' })
  pricePerGallonCents: number;
}
