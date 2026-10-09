import { InvalidPriceError } from '../errors/invalid.price.error';

export enum ProductName {
  PremiumGasoline = 'Gasolina Premium',
  RegularGasoline = 'Gasolina Regular',
  OptimumDiesel = 'Gasoil Óptimo',
  RegularDiesel = 'Gasoil Regular',
}

export enum ProductId {
  PremiumGasoline = 'premium-gasoline',
  RegularGasoline = 'regular-gasoline',
  OptimumDiesel = 'optimum-diesel',
  RegularDiesel = 'regular-diesel',
}

export class Product {
  readonly id: ProductId;
  readonly name: ProductName;
  readonly pricePerGallonCents: number; //El precio por galón aqui no debo saberlo

  constructor(id: ProductId, name: ProductName, pricePerGallonCents: number) {
    const hasDecimals = !Number.isInteger(pricePerGallonCents);
    if (hasDecimals) {
      throw new InvalidPriceError(pricePerGallonCents);
    }

    const isZeroOrNegative = pricePerGallonCents <= 0;
    if (isZeroOrNegative) {
      throw new InvalidPriceError(pricePerGallonCents);
    }

    this.id = id;
    this.name = name;
    this.pricePerGallonCents = pricePerGallonCents;
  }
}
