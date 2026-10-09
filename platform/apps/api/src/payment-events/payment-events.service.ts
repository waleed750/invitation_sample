import {ConflictException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException, UnauthorizedException} from '@nestjs/common';
import type {IncomingHttpHeaders} from 'node:http';
import {AppConfigService} from '../config/app-config.service';
import {EasyConfirmProvider} from './easyconfirm.provider';
import {GenericHmacProvider} from './generic-hmac.provider';
import type {ParsedEvent} from './payment-event-provider';
import {PaymentEventsRepository, type PaymentSqlResult, type QueueStatus} from './payment-events.repository';

export function paymentFailure(reason: string | undefined): Error {
  if (reason === 'not_found') return new NotFoundException('Payment event or order not found');
  if (reason === 'not_admin') return new ForbiddenException('Insufficient role');
  if (reason !== undefined && ['amount_mismatch', 'not_pending', 'not_manual', 'no_slot', 'event_already_matched',
    'event_not_available', 'outside_window', 'provider_mismatch', 'note_required'].includes(reason)) {
    return new ConflictException({code: reason, message: 'Payment operation refused'});
  }
  return new ServiceUnavailableException('Payments service unavailable');
}

/** Do not propagate database errors (they may contain raw provider data). */
export async function paymentCall<T>(call: () => Promise<T>): Promise<T> {
  try { return await call(); } catch { throw new ServiceUnavailableException('Payments service unavailable'); }
}

@Injectable()
export class PaymentEventsService {
  constructor(private readonly repository: PaymentEventsRepository, private readonly config: AppConfigService) {}

  async receive(provider: 'generic-hmac' | 'easyconfirm', rawBody: Buffer, headers: IncomingHttpHeaders): Promise<{ok: true; duplicate?: true}> {
    let event: ParsedEvent;
    try {
      const adapter = provider === 'easyconfirm'
        ? new EasyConfirmProvider(this.config.easyconfirmApiKey, this.config.paymentEventsSecret,
          this.config.easyconfirmSignatureHeader, this.config.easyconfirmTimestampHeader)
        : new GenericHmacProvider(this.config.paymentEventsSecret);
      event = adapter.verify(rawBody, headers);
    } catch {
      // Identical response for missing key, malformed payload, bad HMAC and replay.
      throw new UnauthorizedException('Invalid payment notification');
    }
    return paymentCall(() => this.repository.ingestAsServiceRole(provider, event, rawBody.toString('utf8')));
  }

  list(status: QueueStatus, limit: number): Promise<Record<string, unknown>[]> {
    return paymentCall(() => this.repository.listAsServiceRole(status, limit));
  }

  async assign(adminId: string, eventId: string, orderId: string, note: string): Promise<{ok: true; already: boolean}> {
    const result: PaymentSqlResult = await paymentCall(() => this.repository.assignAsServiceRole(adminId, eventId, orderId, note));
    if (result.ok !== true) throw paymentFailure(result.reason);
    return {ok: true, already: result.already === true};
  }
}
