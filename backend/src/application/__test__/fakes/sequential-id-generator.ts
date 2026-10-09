import { IdGenerator } from '../../ports/id-generator';

// An id generator for tests: it gives order-1, order-2, order-3...
export class SequentialIdGenerator implements IdGenerator {
  lastNumber = 0;

  generate(): string {
    this.lastNumber = this.lastNumber + 1;
    return `order-${this.lastNumber}`;
  }
}
