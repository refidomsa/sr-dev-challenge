import { InvalidGallonsError } from '../errors/invalid-gallons.error';
import { MinimumGallonsError } from '../errors/minimum-gallons.error';
import { ProductId } from './product';

export const MINIMUM_GALLONS_PER_LINE = 500;
export class OrderLine {
  readonly productId: ProductId;
  readonly gallons: number;
  readonly unitPriceCents: number;

  constructor(productId: ProductId, gallons: number, unitPriceCents: number) {
    const hasDecimals = !Number.isInteger(gallons);
    if (hasDecimals) {
      throw new InvalidGallonsError(gallons);
    }

    const isBelowMinimum = gallons < MINIMUM_GALLONS_PER_LINE;
    if (isBelowMinimum) {
      throw new MinimumGallonsError(gallons, MINIMUM_GALLONS_PER_LINE);
    }

    this.productId = productId;
    this.gallons = gallons;
    this.unitPriceCents = unitPriceCents;
  }

  getSubtotalPay(): number {
    return this.gallons * this.unitPriceCents;
  }
}
