import {z} from 'zod';

/** ISO-4217-style alphabetic currency code, upper case. */
export const currencyCode = z.string().regex(/^[A-Z]{3}$/);

/** Integer minor units (1/100 of the major unit) plus a currency. */
export type Money = {amountMinor: number; currency: string};

/** Convert a major-unit amount (e.g. 1299.5 EGP) to integer minor units. */
export function toMinor(major: number): number {
  return Math.round(major * 100);
}

/** Convert integer minor units back to a major-unit amount. */
export function fromMinor(minor: number): number {
  return minor / 100;
}
