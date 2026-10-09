import { Product, ProductId } from '../entities/product';

// NestJS uses this name to know which class to give when a use case asks for it.
export const PRODUCT_REPOSITORY = 'ProductRepository';

export interface ProductRepository {
  findAll(): Promise<Product[]>;
  findById(id: ProductId): Promise<Product | null>;
}
