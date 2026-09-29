import {Controller, Get} from '@nestjs/common';
import {SkipThrottle, Throttle} from '@nestjs/throttler';
import {version} from '../../package.json';
import {Public} from '../common/decorators';

export interface HealthResponse {
  ok: true;
  version: string;
  uptimeSeconds: number;
}

/** Liveness probe for uptime checks. Public; the probe itself is never throttled. */
@Public()
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  @SkipThrottle()
  @Get()
  check(): HealthResponse {
    return {ok: true, version, uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000)};
  }

  /**
   * Stricter-limit example on a public route: at most 5 calls per minute per
   * IP (overrides the global throttler). Used by the throttling tests.
   */
  @Throttle({default: {limit: 5, ttl: 60_000}})
  @Get('ping')
  ping(): {pong: true} {
    return {pong: true};
  }
}
