import type {CommerceClient} from './types';
import {ApiCommerceClient} from './api';
import {MockCommerceClient} from './mock';

export function isDemoMode(): boolean {
  return (process.env.COMMERCE_MODE ?? 'mock') === 'mock';
}

export function getCommerceClient(): CommerceClient {
  const mode = process.env.COMMERCE_MODE ?? 'mock';
  if (mode === 'api') return new ApiCommerceClient();
  if (mode !== 'mock') throw new Error(`Unsupported COMMERCE_MODE: ${mode}`);
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_COMMERCE !== '1') {
    throw new Error('Mock commerce is disabled in production. Set COMMERCE_MODE=api or explicitly set ALLOW_DEMO_COMMERCE=1.');
  }
  return new MockCommerceClient();
}

export type {CommerceClient} from './types';

