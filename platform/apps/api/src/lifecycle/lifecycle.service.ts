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
  errors: string[];
}

function envelopeData(value: unknown, step: string): unknown {
  if (!isRecord(value) || !('data' in value) || !('error' in value)) {
    throw new Error(`lifecycle ${step} returned an unexpected payload`);
  }
  const {data, error}: {data: unknown; error: unknown} = value as {data: unknown; error: unknown};
  if (error !== null) throw new Error(`lifecycle ${step} failed`);
  return data;
}

function toDueReminder(value: unknown): DueReminder | null {
  if (!isRecord(value)) return null;
  const invitationId = value.invitation_id;
  const ownerId = value.owner_id;
  const onlineUntil = value.online_until;
  if (typeof invitationId !== 'string' || typeof ownerId !== 'string' || typeof onlineUntil !== 'string') return null;
  return {invitationId, ownerId, onlineUntil};
}

function toCount(data: unknown, step: string): number {
  // PostgREST returns integer RPC results as JSON numbers; tolerate numeric strings.
  const count = typeof data === 'number' ? data : typeof data === 'string' ? Number(data) : NaN;
  if (!Number.isSafeInteger(count) || count < 0) throw new Error(`lifecycle ${step} returned a bad count`);
  return count;
}

/**
 * Daily lifecycle job (B4, PLATFORM_PLAN §16.3). Step order is fixed:
 * reminders (notify, then mark) → end expired → purge/archive → expire points.
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
    const summary: LifecycleSummary = {reminded: 0, ended: 0, purged: 0, archived: 0, pointsExpired: 0, errors: []};
    await this.sendReminders(now, summary);
    await this.endExpired(now, summary);
    await this.purgeAndArchive(now, summary);
    await this.expirePoints(now, summary);
    return summary;
  }

  private async sendReminders(now: Date, summary: LifecycleSummary): Promise<void> {
    let rows: unknown;
    try {
      rows = envelopeData(await this.repository.dueRemindersAsServiceRole(now), 'reminders');
      if (!Array.isArray(rows)) throw new Error('lifecycle reminders returned a bad payload');
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
      summary.ended = toCount(envelopeData(await this.repository.endExpiredAsServiceRole(now), 'end'), 'end');
    } catch {
      this.logger.error('lifecycle end step failed');
      summary.errors.push('end');
    }
  }

  private async purgeAndArchive(now: Date, summary: LifecycleSummary): Promise<void> {
    try {
      const data = envelopeData(await this.repository.purgeAndArchiveAsServiceRole(now), 'purge_archive');
      if (!isRecord(data)) throw new Error('lifecycle purge_archive returned a bad payload');
      summary.purged = toCount(data.purged, 'purge_archive');
      summary.archived = toCount(data.archived, 'purge_archive');
    } catch {
      this.logger.error('lifecycle purge_archive step failed');
      summary.errors.push('purge_archive');
    }
  }

  private async expirePoints(now: Date, summary: LifecycleSummary): Promise<void> {
    try {
      summary.pointsExpired = toCount(envelopeData(await this.repository.expirePointsAsServiceRole(now), 'expire_points'), 'expire_points');
    } catch {
      this.logger.error('lifecycle expire_points step failed');
      summary.errors.push('expire_points');
    }
  }
}
