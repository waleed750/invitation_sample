import {Injectable} from '@nestjs/common';
import {ThrottlerStorageService, type ThrottlerStorage} from '@nestjs/throttler';

/** DI token for the active rate-limit storage backend. */
export const RATE_LIMIT_STORAGE = 'RATE_LIMIT_STORAGE';

/**
 * Storage seam for `@nestjs/throttler`. Today this is the in-memory backend;
 * to move to Redis later, implement this interface with a Redis store and swap
 * the `RATE_LIMIT_STORAGE` provider in `RateLimitStorageModule` — no guard or
 * controller changes needed. Redis is deliberately NOT a dependency yet.
 */
export type RateLimitStorage = ThrottlerStorage;

/** In-memory backend. Single instance only — do not scale horizontally with it. */
@Injectable()
export class InMemoryRateLimitStorage extends ThrottlerStorageService implements RateLimitStorage {}
