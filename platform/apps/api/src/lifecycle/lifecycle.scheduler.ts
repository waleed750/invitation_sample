import {Inject, Injectable} from '@nestjs/common';
import {Cron} from '@nestjs/schedule';
import {AppLogger} from '../common/app-logger';
import {CLOCK, type Clock} from '../common/clock';
import {AppConfigService} from '../config/app-config.service';
import {LifecycleService} from './lifecycle.service';

/**
 * Cron wrapper around `LifecycleService.runDaily`: daily at 03:00
 * Africa/Cairo (PLATFORM_PLAN §16.3). The schedule stays registered but the
 * handler is a no-op when `NODE_ENV=test` or `LIFECYCLE_CRON_ENABLED=false`,
 * so specs and the OpenAPI generator never fire the job.
 */
@Injectable()
export class LifecycleScheduler {
  constructor(
    private readonly lifecycle: LifecycleService,
    private readonly config: AppConfigService,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly logger: AppLogger
  ) {}

  /** Extracted for specs: true only outside tests with the kill-switch on. */
  cronEnabled(): boolean {
    return this.config.nodeEnv !== 'test' && this.config.lifecycleCronEnabled;
  }

  @Cron('0 3 * * *', {name: 'lifecycle-daily', timeZone: 'Africa/Cairo'})
  async handleCron(): Promise<void> {
    if (!this.cronEnabled()) return;
    const summary = await this.lifecycle.runDaily(this.clock.now());
    // Counts only: the summary carries no ids, phones, or other PII by design.
    this.logger.log(
      `lifecycle daily complete reminded=${String(summary.reminded)} ended=${String(summary.ended)} ` +
      `purged=${String(summary.purged)} archived=${String(summary.archived)} ` +
      `pointsExpired=${String(summary.pointsExpired)} errors=${String(summary.errors.length)}`
    );
  }
}
