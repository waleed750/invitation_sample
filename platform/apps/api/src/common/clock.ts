import {Injectable} from '@nestjs/common';

/** DI token for the current-time provider. Tests inject a fixed clock. */
export const CLOCK = 'CLOCK';

/** Current time. A provider (not `Date.now()` inline) so time-dependent logic is testable. */
export interface Clock {
  now(): Date;
}

/** Production clock: the real wall time. */
@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
