import type {EmailSender} from '../auth';
import {AppLogger} from '../common/app-logger';
import {AppConfigService} from '../config/app-config.service';
import type {NotificationsRepository} from './notifications.repository';
import {NotificationsService} from './notifications.service';

describe('NotificationsService', () => {
  let repository: jest.Mocked<NotificationsRepository>;
  let emailSender: jest.Mocked<EmailSender>;
  let config: {notificationsEmailEnabled: boolean};
  let logger: jest.Mocked<AppLogger>;
  let service: NotificationsService;

  beforeEach(() => {
    repository = {
      getUserRecipient: jest.fn(),
      getOrderRecipient: jest.fn()
    } as unknown as jest.Mocked<NotificationsRepository>;

    emailSender = {
      send: jest.fn().mockResolvedValue(undefined)
    };

    config = {
      notificationsEmailEnabled: true
    };

    logger = {
      log: jest.fn(),
      error: jest.fn()
    } as unknown as jest.Mocked<AppLogger>;

    service = new NotificationsService(
      repository,
      emailSender,
      config as unknown as AppConfigService,
      logger
    );
  });

  describe('endReminder', () => {
    it('sends Arabic email when recipient preferredLocale is ar', async () => {
      repository.getUserRecipient.mockResolvedValue({
        email: 'user@example.com',
        preferredLocale: 'ar',
        name: 'User'
      });

      await service.endReminder('user-1', 'inv-1', new Date('2026-06-01'));

      expect(emailSender.send).toHaveBeenCalledTimes(1);
      expect(emailSender.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('تذكير')
        })
      );
    });

    it('sends English email when recipient preferredLocale is en', async () => {
      repository.getUserRecipient.mockResolvedValue({
        email: 'user@example.com',
        preferredLocale: 'en',
        name: 'User'
      });

      await service.endReminder('user-1', 'inv-1', new Date('2026-06-01'));

      expect(emailSender.send).toHaveBeenCalledTimes(1);
      expect(emailSender.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Reminder')
        })
      );
    });

    it('skips silently without PII when user has no email', async () => {
      repository.getUserRecipient.mockResolvedValue({
        email: null,
        preferredLocale: 'ar',
        name: 'User'
      });

      await service.endReminder('user-1', 'inv-1', new Date('2026-06-01'));

      expect(emailSender.send).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('skipping notification: recipient has no email');
    });

    it('skips silently without PII when user profile is not found', async () => {
      repository.getUserRecipient.mockResolvedValue(null);

      await service.endReminder('user-1', 'inv-1', new Date('2026-06-01'));

      expect(emailSender.send).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('skipping notification: recipient has no email');
    });

    it('skips when notifications are disabled by config', async () => {
      config.notificationsEmailEnabled = false;
      repository.getUserRecipient.mockResolvedValue({
        email: 'user@example.com',
        preferredLocale: 'ar',
        name: 'User'
      });

      await service.endReminder('user-1', 'inv-1', new Date('2026-06-01'));

      expect(emailSender.send).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('email notifications disabled by config');
    });

    it('does not throw when email sender throws (catches and logs)', async () => {
      repository.getUserRecipient.mockResolvedValue({
        email: 'user@example.com',
        preferredLocale: 'ar',
        name: 'User'
      });
      emailSender.send.mockRejectedValue(new Error('SMTP timeout'));

      await expect(service.endReminder('user-1', 'inv-1', new Date('2026-06-01'))).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith('failed to dispatch endReminder notification');
    });
  });

  describe('paymentConfirmed', () => {
    it('sends confirmation email when order recipient exists', async () => {
      repository.getOrderRecipient.mockResolvedValue({
        email: 'customer@example.com',
        preferredLocale: 'ar',
        name: 'Customer'
      });

      await service.paymentConfirmed('order-123');

      expect(emailSender.send).toHaveBeenCalledTimes(1);
      expect(emailSender.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: expect.stringContaining('تم تأكيد الدفع')
        })
      );
    });

    it('skips silently when order recipient has no email', async () => {
      repository.getOrderRecipient.mockResolvedValue({
        email: null,
        preferredLocale: 'ar',
        name: 'Customer'
      });

      await service.paymentConfirmed('order-123');

      expect(emailSender.send).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('skipping notification: recipient has no email');
    });

    it('catches and logs errors without throwing', async () => {
      repository.getOrderRecipient.mockRejectedValue(new Error('db error'));

      await expect(service.paymentConfirmed('order-123')).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalledWith('failed to dispatch paymentConfirmed notification');
    });
  });

  describe('paymentRejected', () => {
    it('sends rejection email with reason', async () => {
      repository.getOrderRecipient.mockResolvedValue({
        email: 'customer@example.com',
        preferredLocale: 'en',
        name: 'Customer'
      });

      await service.paymentRejected('order-123', 'Amount mismatch');

      expect(emailSender.send).toHaveBeenCalledTimes(1);
      expect(emailSender.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: expect.stringContaining('Payment Verification Failed'),
          text: expect.stringContaining('Amount mismatch')
        })
      );
    });

    it('skips silently when order recipient has no email', async () => {
      repository.getOrderRecipient.mockResolvedValue(null);

      await service.paymentRejected('order-123', 'Amount mismatch');

      expect(emailSender.send).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('skipping notification: recipient has no email');
    });
  });

  describe('orderExpired', () => {
    it('sends order expired email', async () => {
      repository.getOrderRecipient.mockResolvedValue({
        email: 'customer@example.com',
        preferredLocale: 'ar',
        name: 'Customer'
      });

      await service.orderExpired('order-123');

      expect(emailSender.send).toHaveBeenCalledTimes(1);
      expect(emailSender.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: expect.stringContaining('انتهت مهلة سداد الطلب')
        })
      );
    });

    it('skips silently when recipient has no email', async () => {
      repository.getOrderRecipient.mockResolvedValue({
        email: null,
        preferredLocale: 'en',
        name: null
      });

      await service.orderExpired('order-123');

      expect(emailSender.send).not.toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith('skipping notification: recipient has no email');
    });
  });
});
