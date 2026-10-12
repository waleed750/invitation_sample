import {Inject, Injectable} from '@nestjs/common';
import {EMAIL_SENDER, type EmailSender} from '../auth';
import {AppLogger} from '../common/app-logger';
import {AppConfigService} from '../config/app-config.service';
import {NotificationsRepository} from './notifications.repository';
import {arTemplates, enTemplates} from './templates';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
    private readonly config: AppConfigService,
    private readonly logger: AppLogger
  ) {}

  async endReminder(userId: string, invitationId: string, onlineUntil: Date | string): Promise<void> {
    try {
      if (!this.config.notificationsEmailEnabled) {
        this.logger.log('email notifications disabled by config');
        return;
      }
      const recipient = await this.repository.getUserRecipient(userId);
      if (!recipient || !recipient.email) {
        this.logger.log('skipping notification: recipient has no email');
        return;
      }
      const templates = recipient.preferredLocale === 'en' ? enTemplates : arTemplates;
      const email = templates.endReminder({invitationId, onlineUntil});
      await this.emailSender.send({
        to: recipient.email,
        subject: email.subject,
        text: email.text,
        html: email.html
      });
      this.logger.log('end reminder email sent');
    } catch {
      this.logger.error('failed to dispatch endReminder notification');
    }
  }

  async paymentConfirmed(orderId: string): Promise<void> {
    try {
      if (!this.config.notificationsEmailEnabled) {
        this.logger.log('email notifications disabled by config');
        return;
      }
      const recipient = await this.repository.getOrderRecipient(orderId);
      if (!recipient || !recipient.email) {
        this.logger.log('skipping notification: recipient has no email');
        return;
      }
      const templates = recipient.preferredLocale === 'en' ? enTemplates : arTemplates;
      const email = templates.paymentConfirmed({orderId});
      await this.emailSender.send({
        to: recipient.email,
        subject: email.subject,
        text: email.text,
        html: email.html
      });
      this.logger.log('payment confirmed email sent');
    } catch {
      this.logger.error('failed to dispatch paymentConfirmed notification');
    }
  }

  async paymentRejected(orderId: string, reason: string): Promise<void> {
    try {
      if (!this.config.notificationsEmailEnabled) {
        this.logger.log('email notifications disabled by config');
        return;
      }
      const recipient = await this.repository.getOrderRecipient(orderId);
      if (!recipient || !recipient.email) {
        this.logger.log('skipping notification: recipient has no email');
        return;
      }
      const templates = recipient.preferredLocale === 'en' ? enTemplates : arTemplates;
      const email = templates.paymentRejected({orderId, reason});
      await this.emailSender.send({
        to: recipient.email,
        subject: email.subject,
        text: email.text,
        html: email.html
      });
      this.logger.log('payment rejected email sent');
    } catch {
      this.logger.error('failed to dispatch paymentRejected notification');
    }
  }

  async orderExpired(orderId: string): Promise<void> {
    try {
      if (!this.config.notificationsEmailEnabled) {
        this.logger.log('email notifications disabled by config');
        return;
      }
      const recipient = await this.repository.getOrderRecipient(orderId);
      if (!recipient || !recipient.email) {
        this.logger.log('skipping notification: recipient has no email');
        return;
      }
      const templates = recipient.preferredLocale === 'en' ? enTemplates : arTemplates;
      const email = templates.orderExpired({orderId});
      await this.emailSender.send({
        to: recipient.email,
        subject: email.subject,
        text: email.text,
        html: email.html
      });
      this.logger.log('order expired email sent');
    } catch {
      this.logger.error('failed to dispatch orderExpired notification');
    }
  }
}
