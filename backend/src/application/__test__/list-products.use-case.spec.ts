import { Product, ProductId, ProductName } from '../../domain/entities/product';
import { ListProductsUseCase } from '../use-cases/list-products.use-case';
import { InMemoryProductRepository } from './fakes/in-memory-product.repository';

describe('ListProductsUseCase', () => {
  it('returns all the products', async () => {
    const productRepository = new InMemoryProductRepository();
    productRepository.products.push(
      new Product(
        ProductId.PremiumGasoline,
        ProductName.PremiumGasoline,
        29010,
      ),
    );
    productRepository.products.push(
      new Product(ProductId.RegularDiesel, ProductName.RegularDiesel, 22140),
    );
    const listProducts = new ListProductsUseCase(productRepository);

    const products = await listProducts.execute();

    expect(products.length).toBe(2);
    expect(products[0].id).toBe(ProductId.PremiumGasoline);
  });
});
