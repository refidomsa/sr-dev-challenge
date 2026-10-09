import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Product,
  ProductId,
  ProductName,
} from '../../../domain/entities/product';
import { ProductRepository } from '../../../domain/repositories/product.repository';
import { ProductOrmEntity } from '../entities/product.orm-entity';

@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async findAll(): Promise<Product[]> {
    const rows = await this.repository.find({ order: { name: 'ASC' } });

    const products: Product[] = [];
    for (const row of rows) {
      products.push(this.toDomain(row));
    }
    return products;
  }

  async findById(id: ProductId): Promise<Product | null> {
    const row = await this.repository.findOneBy({ id: id });
    if (row === null) {
      return null;
    }
    return this.toDomain(row);
  }

  // Turns a row of the table into the Product of the domain.
  private toDomain(row: ProductOrmEntity): Product {
    return new Product(
      row.id as ProductId,
      row.name as ProductName,
      row.pricePerGallonCents,
    );
  }
}
