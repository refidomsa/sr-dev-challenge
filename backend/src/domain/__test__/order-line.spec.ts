import { InvalidGallonsError } from '../errors/invalid-gallons.error';
import { MinimumGallonsError } from '../errors/minimum-gallons.error';
import { OrderLine } from '../entities/order-line';
import { Product, ProductId, ProductName } from '../entities/product';

describe('OrderLine', () => {
  describe('gallons', () => {
    it('accepts exactly 500 gallons, the minimum', () => {
      const line = new OrderLine(ProductId.PremiumGasoline, 500, 29010);

      expect(line.gallons).toBe(500);
    });

    it('rejects 499 gallons', () => {
      expect(
        () => new OrderLine(ProductId.PremiumGasoline, 499, 29010),
      ).toThrow(MinimumGallonsError);
    });

    it('rejects 0 gallons', () => {
      expect(() => new OrderLine(ProductId.PremiumGasoline, 0, 29010)).toThrow(
        MinimumGallonsError,
      );
    });

    it('rejects gallons with decimals', () => {
      expect(
        () => new OrderLine(ProductId.PremiumGasoline, 500.5, 29010),
      ).toThrow(InvalidGallonsError);
    });
  });

  describe('price', () => {
    it('copies the product price when the line is created', () => {
      const line = new OrderLine(ProductId.PremiumGasoline, 500, 29010);

      expect(line.unitPriceCents).toBe(29010);
    });

    it('keeps its price when the product price changes later', () => {
      const line = new OrderLine(ProductId.PremiumGasoline, 500, 29010);

      // Same product, new price: RD$300.00 per gallon
      const repricedGasoline = new Product(
        ProductId.PremiumGasoline,
        ProductName.PremiumGasoline,
        30000,
      );

      expect(repricedGasoline.pricePerGallonCents).toBe(30000);
      expect(line.unitPriceCents).toBe(29010);
    });
  });

  describe('subtotal', () => {
    it('multiplies gallons by the unit price', () => {
      const line = new OrderLine(ProductId.PremiumGasoline, 500, 29010);

      expect(line.getSubtotalPay()).toBe(14505000);
    });
  });

  describe('product', () => {
    it('remembers which product was ordered', () => {
      const line = new OrderLine(ProductId.PremiumGasoline, 500, 29010);

      expect(line.productId).toBe(ProductId.PremiumGasoline);
    });
  });
});
