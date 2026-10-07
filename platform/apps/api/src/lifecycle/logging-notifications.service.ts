import {Injectable} from '@nestjs/common';
import {AppLogger} from '../common/app-logger';
import type {NotificationsPort} from './notifications.port';

/**
 * Logging-only `NotificationsPort`. A reminder names its owner and invitation,
 * so the log line carries no ids, dates, or contact details — counts only.
 * Real WhatsApp/email delivery plugs in behind the same port later (B4).
 */
@Injectable()
export class LoggingNotificationsService implements NotificationsPort {
  constructor(private readonly logger: AppLogger) {}

  // Implements sendEndReminder(ownerId, invitationId, onlineUntil) with no
  // declared parameters on purpose: the values must never reach logs, and an
  // undeclared parameter cannot leak. Fewer parameters still satisfies the port.
  // Non-async (nothing to await on the logging channel).
  sendEndReminder(): Promise<void> {
    this.logger.log('lifecycle end reminder dispatched (logging channel)');
    return Promise.resolve();
  }
}
