import type {IncomingHttpHeaders} from 'node:http';

export interface ParsedEvent {
  externalId: string;
  amountMinor: number;
  currency: string;
  sender?: string;
  referenceText?: string;
  receivedAt: string;
}

export interface PaymentEventProvider {
  /** Verify exact bytes before parsing. Throws for every invalid notification. */
  verify(rawBody: Buffer, headers: IncomingHttpHeaders): ParsedEvent;
}
