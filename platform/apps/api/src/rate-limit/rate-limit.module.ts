import {Module} from '@nestjs/common';
import {ThrottlerModule} from '@nestjs/throttler';
import {AppConfigService} from '../config/app-config.service';
import {InMemoryRateLimitStorage, RATE_LIMIT_STORAGE, type RateLimitStorage} from './rate-limit-storage';

@Module({
  providers: [InMemoryRateLimitStorage, {provide: RATE_LIMIT_STORAGE, useExisting: InMemoryRateLimitStorage}],
  exports: [RATE_LIMIT_STORAGE]
})
export class RateLimitStorageModule {}

/**
 * Global throttling: `THROTTLE_LIMIT` requests per `THROTTLE_TTL_MS` window
 * per IP. The guard itself is bound globally in `AppModule` (before auth, so
 * abusive traffic is shed even without credentials). Per-route overrides use
 * `@Throttle()` / `@SkipThrottle()` from `@nestjs/throttler`.
 */
@Module({
  imports: [
    RateLimitStorageModule,
    ThrottlerModule.forRootAsync({
      imports: [RateLimitStorageModule],
      inject: [AppConfigService, RATE_LIMIT_STORAGE],
      useFactory: (config: AppConfigService, storage: RateLimitStorage) => ({
        throttlers: [{name: 'default', ttl: config.throttleTtlMs, limit: config.throttleLimit}],
        storage,
        errorMessage: 'Too many requests'
      })
    })
  ],
  exports: [RateLimitStorageModule]
})
export class RateLimitModule {}
