/**
 * Outbound channel for lifecycle reminders (B4, PLATFORM_PLAN §16.3).
 * Logging-only today; real WhatsApp/email delivery comes later.
 */
export interface NotificationsPort {
  sendEndReminder(ownerId: string, invitationId: string, onlineUntil: Date): Promise<void>;
}

/** DI token for the `NotificationsPort` implementation. */
export const NOTIFICATIONS_PORT = 'NOTIFICATIONS_PORT';
