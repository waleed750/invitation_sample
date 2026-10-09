import {Injectable, ServiceUnavailableException} from '@nestjs/common';
import {z} from 'zod';
import {PaymentEventsRepository} from './payment-events.repository';
import {paymentCall, paymentFailure} from './payment-events.service';

@Injectable()
export class UniqueAmountService {
  constructor(private readonly repository: PaymentEventsRepository) {}
  async allocate(orderId: string): Promise<{amountMinor: number; extraMinor: number}> {
    const id = z.uuid().parse(orderId);
    const result = await paymentCall(() => this.repository.allocateAsServiceRole(id));
    if (result.ok === false) throw paymentFailure(result.reason);
    if (result.amount_minor === undefined || result.extra_minor === undefined) {
      throw new ServiceUnavailableException('Payments service unavailable');
    }
    return {amountMinor: result.amount_minor, extraMinor: result.extra_minor};
  }
}
