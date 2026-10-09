import { Product, ProductId } from '../../../domain/entities/product';
import { ProductRepository } from '../../../domain/repositories/product.repository';

// A repository for tests: it keeps the products in a list instead of a database.
export class InMemoryProductRepository implements ProductRepository {
  products: Product[] = [];

  findAll(): Promise<Product[]> {
    return Promise.resolve(this.products);
  }

  findById(id: ProductId): Promise<Product | null> {
    for (const product of this.products) {
      if (product.id === id) {
        return Promise.resolve(product);
      }
    }
    return Promise.resolve(null);
  }
}
