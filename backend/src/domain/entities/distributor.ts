import { InsufficientCreditError } from '../errors/insufficient-credit.error';
import { InvalidCreditLimitError } from '../errors/invalid-credit-limit.error';
import { Order } from './order';

export class Distributor {
  readonly id: string;
  readonly name: string;
  readonly rnc: string;
  readonly creditLimitCents: number;

  constructor(id: string, name: string, rnc: string, creditLimitCents: number) {
    const hasDecimals = !Number.isInteger(creditLimitCents);
    if (hasDecimals) {
      throw new InvalidCreditLimitError(creditLimitCents);
    }

    const isNegative = creditLimitCents < 0;
    if (isNegative) {
      throw new InvalidCreditLimitError(creditLimitCents);
    }

    this.id = id;
    this.name = name;
    this.rnc = rnc;
    this.creditLimitCents = creditLimitCents;
  }

  // Crédito disponible = límite de crédito − total de sus pedidos en estado Pendiente o Aprobado.
  getAvailableCredit(orders: Order[]): number {
    let creditInUse = 0;

    for (const order of orders) {
      const belongsToThisDistributor = order.distributor === this.id;

      if (belongsToThisDistributor && order.usesCredit()) {
        creditInUse = creditInUse + order.getTotalPay();
      }
    }

    return this.creditLimitCents - creditInUse;
  }

  //El total del pedido no puede superar el crédito disponible del distribuidor.
  assertHasCreditFor(newOrder: Order, existingOrders: Order[]): void {
    const availableCredit = this.getAvailableCredit(existingOrders);
    const orderTotal = newOrder.getTotalPay();

    if (orderTotal > availableCredit) {
      throw new InsufficientCreditError(orderTotal, availableCredit);
    }
  }
}
