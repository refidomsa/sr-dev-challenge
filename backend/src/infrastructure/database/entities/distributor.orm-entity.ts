import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('distributors')
export class DistributorOrmEntity {
  @PrimaryColumn({ type: 'varchar' })
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', unique: true })
  rnc: string;


  @Column({
    name: 'credit_limit_cents',
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  creditLimitCents: number;
}
