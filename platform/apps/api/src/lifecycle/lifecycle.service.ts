import {Inject, Injectable} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import {isRecord} from '../common/type-guards';
import {LifecycleRepository} from './lifecycle.repository';
import {NOTIFICATIONS_PORT, type NotificationsPort} from './notifications.port';

/** One row of `lifecycle_due_reminders` (snake_case from Postgres, parsed here). */
export interface DueReminder {
  invitationId: string;
  ownerId: string;
  onlineUntil: string;
}

/** `runDaily` result. `errors` holds step names only — never ids or PII. */
export interface LifecycleSummary {
  reminded: number;
  ended: number;
  purged: number;
  archived: number;
  pointsExpired: number;
  ordersExpired: number;
  errors: string[];
}

function toDueReminder(value: unknown): DueReminder | null {
  if (!isRecord(value)) return null;
  const invitationId = value.invitation_id;
  const ownerId = value.owner_id;
  const onlineUntil = value.online_until;
  if (typeof invitationId !== 'string' || typeof ownerId !== 'string' || typeof onlineUntil !== 'string') return null;
  return {invitationId, ownerId, onlineUntil};
}

/**
 * Daily lifecycle job (B4, PLATFORM_PLAN §16.3). Step order is fixed:
 * reminders (notify, then mark) → end expired → purge/archive → expire points
 * → expire unpaid manual orders (72 h, B7a).
 * One failing step never stops the others; failures are logged (no PII) and
 * collected in `summary.errors`. Time comes from the caller (`CLOCK`), never
 * `Date.now()`, so fixed-clock specs cover every transition.
 */
@Injectable()
export class LifecycleService {
  constructor(
    private readonly repository: LifecycleRepository,
    @Inject(NOTIFICATIONS_PORT) private readonly notifications: NotificationsPort,
    private readonly logger: AppLogger
  ) {}

  async runDaily(now: Date): Promise<LifecycleSummary> {
    const summary: LifecycleSummary = {reminded: 0, ended: 0, purged: 0, archived: 0, pointsExpired: 0, ordersExpired: 0, errors: []};
    await this.sendReminders(now, summary);
    await this.endExpired(now, summary);
    await this.purgeAndArchive(now, summary);
    await this.expirePoints(now, summary);
    await this.expireStaleOrders(summary);
    return summary;
  }

  private async sendReminders(now: Date, summary: LifecycleSummary): Promise<void> {
    let rows: unknown[];
    try {
      rows = await this.repository.dueRemindersAsServiceRole(now);
    } catch {
      this.logger.error('lifecycle reminders step failed');
      summary.errors.push('reminders');
      return;
    }
    for (const row of rows) {
      const reminder = toDueReminder(row);
      if (reminder === null) {
        this.logger.error('lifecycle reminder row unreadable, skipped');
        summary.errors.push('reminder');
        continue;
      }
      try {
        // Mark only after notify succeeds: a crash between the two re-sends once.
        await this.notifications.sendEndReminder(reminder.ownerId, reminder.invitationId, new Date(reminder.onlineUntil));
        await this.repository.markRemindedAsServiceRole(reminder.invitationId, now);
        summary.reminded += 1;
      } catch {
        this.logger.error('lifecycle reminder failed');
        summary.errors.push('reminder');
      }
    }
  }

  private async endExpired(now: Date, summary: LifecycleSummary): Promise<void> {
    try {
      summary.ended = await this.repository.endExpiredAsServiceRole(now);
    } catch {
      this.logger.error('lifecycle end step failed');
      summary.errors.push('end');
    }
  }

  private async purgeAndArchive(now: Date, summary: LifecycleSummary): Promise<void> {
    try {
      const result = await this.repository.purgeAndArchiveAsServiceRole(now);
      summary.purged = result.purged;
      summary.archived = result.archived;
    } catch {
      this.logger.error('lifecycle purge_archive step failed');
      summary.errors.push('purge_archive');
    }
  }

  private async expirePoints(now: Date, summary: LifecycleSummary): Promise<void> {
    try {
      summary.pointsExpired = await this.repository.expirePointsAsServiceRole(now);
    } catch {
      this.logger.error('lifecycle expire_points step failed');
      summary.errors.push('expire_points');
    }
  }

  private async expireStaleOrders(summary: LifecycleSummary): Promise<void> {
    try {
      summary.ordersExpired = await this.repository.expireStaleManualOrdersAsServiceRole();
    } catch {
      this.logger.error('lifecycle expire_orders step failed');
      summary.errors.push('expire_orders');
    }
  }
}
