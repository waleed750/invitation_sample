/**
 * TODO(EasyConfirm docs): confirm signature algorithm/encoding, exact signed
 * bytes and timestamp units, signature/timestamp headers, signing-secret vs API
 * key roles, replay/retry semantics, event ID uniqueness, payload field names,
 * currency/minor-unit scale, transfer completion status and received_at timezone.
 * Also confirm webhook registration and whether a reconciliation list API exists.
 * This is a PROVISIONAL generic-HMAC adapter, not verified EasyConfirm compatibility.
 */
import type {IncomingHttpHeaders} from 'node:http';
import {GenericHmacProvider, type EventFields} from './generic-hmac.provider';
import type {ParsedEvent, PaymentEventProvider} from './payment-event-provider';

// Replace only this table once an actual provider payload is available.
export const EASYCONFIRM_FIELDS: EventFields = {
  externalId: 'id', amount: 'amount', currency: 'currency', sender: 'sender',
  referenceText: 'note', receivedAt: 'received_at'
};

export class EasyConfirmProvider implements PaymentEventProvider {
  private readonly delegate: GenericHmacProvider;
  constructor(
    private readonly apiKey: string | undefined,
    secret: string | undefined,
    signatureHeader = 'x-signature',
    timestampHeader = 'x-timestamp'
  ) {
    this.delegate = new GenericHmacProvider(secret, signatureHeader, timestampHeader, EASYCONFIRM_FIELDS);
  }
  verify(rawBody: Buffer, headers: IncomingHttpHeaders): ParsedEvent {
    // An API key alone never substitutes for a valid notification signature.
    if (this.apiKey === undefined || this.apiKey.trim() === '') throw new Error('Provider disabled');
    return this.delegate.verify(rawBody, headers);
  }
}
