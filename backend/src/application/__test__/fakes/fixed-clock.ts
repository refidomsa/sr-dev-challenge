import { Clock } from '../../ports/clock';

// A clock for tests: it always tells the date it was given.
export class FixedClock implements Clock {
  currentDate: Date;

  constructor(currentDate: Date) {
    this.currentDate = currentDate;
  }

  now(): Date {
    return this.currentDate;
  }
}
