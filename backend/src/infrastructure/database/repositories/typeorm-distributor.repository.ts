import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Distributor } from '../../../domain/entities/distributor';
import { DistributorRepository } from '../../../domain/repositories/distributor.repository';
import { DistributorOrmEntity } from '../entities/distributor.orm-entity';

@Injectable()
export class TypeOrmDistributorRepository implements DistributorRepository {
  constructor(
    @InjectRepository(DistributorOrmEntity)
    private readonly repository: Repository<DistributorOrmEntity>,
  ) { }

  async findAll(): Promise<Distributor[]> {
    const rows = await this.repository.find({ order: { name: 'ASC' } });

    const distributors: Distributor[] = [];
    for (const row of rows) {
      distributors.push(this.toDomain(row));
    }
    return distributors;
  }

  async findById(id: string): Promise<Distributor | null> {
    const row = await this.repository.findOneBy({ id: id });
    if (row === null) {
      return null;
    }
    return this.toDomain(row);
  }

  private toDomain(row: DistributorOrmEntity): Distributor {
    return new Distributor(row.id, row.name, row.rnc, row.creditLimitCents);
  }
}
