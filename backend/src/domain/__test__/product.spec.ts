import { Product, ProductId, ProductName } from '../entities/product';
import { InvalidPriceError } from '../errors/invalid.price.error';

describe('Product', () => {
  it('keeps its id, name and price', () => {
    const product = new Product(
      ProductId.PremiumGasoline,
      ProductName.PremiumGasoline,
      29010,
    );

    expect(product.id).toBe(ProductId.PremiumGasoline);
    expect(product.name).toBe('Gasolina Premium');
    expect(product.pricePerGallonCents).toBe(29010);
  });

  describe('price', () => {
    it('accepts a price of 1 cent, the smallest valid price', () => {
      const product = new Product(
        ProductId.PremiumGasoline,
        ProductName.PremiumGasoline,
        1,
      );

      expect(product.pricePerGallonCents).toBe(1);
    });

    it('rejects a price of 0', () => {
      expect(
        () =>
          new Product(
            ProductId.PremiumGasoline,
            ProductName.PremiumGasoline,
            0,
          ),
      ).toThrow(InvalidPriceError);
    });

    it('rejects a negative price', () => {
      expect(
        () =>
          new Product(
            ProductId.PremiumGasoline,
            ProductName.PremiumGasoline,
            -29010,
          ),
      ).toThrow(InvalidPriceError);
    });

    it('rejects a price written in pesos instead of cents', () => {
      // 290.10 is RD$290.10 in pesos; in cents it must be 29010
      expect(
        () =>
          new Product(
            ProductId.PremiumGasoline,
            ProductName.PremiumGasoline,
            290.1,
          ),
      ).toThrow(InvalidPriceError);
    });
  });
});
