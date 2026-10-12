/* eslint-disable */
import {AdminPaymentsService} from '../admin-payments/admin-payments.service';
import type {AdminPaymentsRepository} from '../admin-payments/admin-payments.repository';
import {PaymentEventsService} from '../payment-events/payment-events.service';
import {PaymentEventsRepository} from '../payment-events/payment-events.repository';
import {LifecycleService} from '../lifecycle/lifecycle.service';
import type {LifecycleRepository} from '../lifecycle/lifecycle.repository';
import type {NotificationsPort} from '../lifecycle/notifications.port';
import type {NotificationsService} from './notifications.service';
import {AppLogger} from '../common/app-logger';
import {AppConfigService} from '../config/app-config.service';
import {createHmac} from 'node:crypto';

describe('Notifications wiring points', () => {
  let logger: jest.Mocked<AppLogger>;
  let notifications: jest.Mocked<NotificationsService>;

  beforeEach(() => {
    logger = {
      log: jest.fn(),
      error: jest.fn()
    } as unknown as jest.Mocked<AppLogger>;

    notifications = {
      endReminder: jest.fn().mockResolvedValue(undefined),
      paymentConfirmed: jest.fn().mockResolvedValue(undefined),
      paymentRejected: jest.fn().mockResolvedValue(undefined),
      orderExpired: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<NotificationsService>;
  });

  describe('Admin confirm wiring', () => {
    const adminId = 'admin-uuid';
    const orderId = 'order-uuid';
    const confirmBody = {
      paidAmountMinor: 10000,
      txnRef: 'TXN123'
    };

    it('calls paymentConfirmed once on confirm success', async () => {
      const repo = {
        confirmManualPaymentAsServiceRole: jest.fn().mockResolvedValue({ok: true})
      } as unknown as AdminPaymentsRepository;

      const service = new AdminPaymentsService(repo, logger, notifications);
      const res = await service.confirm(adminId, orderId, confirmBody);

      expect(res).toEqual({ok: true, already: false});
      expect(notifications.paymentConfirmed).toHaveBeenCalledTimes(1);
      expect(notifications.paymentConfirmed).toHaveBeenCalledWith(orderId);
    });

    it('never calls paymentConfirmed on confirm failure', async () => {
      const repo = {
        confirmManualPaymentAsServiceRole: jest.fn().mockResolvedValue({ok: false, reason: 'amount_mismatch'})
      } as unknown as AdminPaymentsRepository;

      const service = new AdminPaymentsService(repo, logger, notifications);
      await expect(service.confirm(adminId, orderId, confirmBody)).rejects.toThrow();

      expect(notifications.paymentConfirmed).not.toHaveBeenCalled();
    });

    it('failure in paymentConfirmed notification does not fail admin confirm', async () => {
      const repo = {
        confirmManualPaymentAsServiceRole: jest.fn().mockResolvedValue({ok: true})
      } as unknown as AdminPaymentsRepository;

      notifications.paymentConfirmed.mockRejectedValue(new Error('notification error'));

      const service = new AdminPaymentsService(repo, logger, notifications);
      const res = await service.confirm(adminId, orderId, confirmBody);

      expect(res).toEqual({ok: true, already: false});
      expect(notifications.paymentConfirmed).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('failed to dispatch paymentConfirmed notification');
    });
  });

  describe('Admin reject wiring', () => {
    const adminId = 'admin-uuid';
    const orderId = 'order-uuid';
    const rejectBody = {
      reason: 'Fake transaction slip'
    };

    it('calls paymentRejected once on reject success', async () => {
      const repo = {
        rejectManualPaymentAsServiceRole: jest.fn().mockResolvedValue({ok: true})
      } as unknown as AdminPaymentsRepository;

      const service = new AdminPaymentsService(repo, logger, notifications);
      const res = await service.reject(adminId, orderId, rejectBody);

      expect(res).toEqual({ok: true});
      expect(notifications.paymentRejected).toHaveBeenCalledTimes(1);
      expect(notifications.paymentRejected).toHaveBeenCalledWith(orderId, 'Fake transaction slip');
    });

    it('never calls paymentRejected on reject failure', async () => {
      const repo = {
        rejectManualPaymentAsServiceRole: jest.fn().mockResolvedValue({ok: false, reason: 'not_pending'})
      } as unknown as AdminPaymentsRepository;

      const service = new AdminPaymentsService(repo, logger, notifications);
      await expect(service.reject(adminId, orderId, rejectBody)).rejects.toThrow();

      expect(notifications.paymentRejected).not.toHaveBeenCalled();
    });

    it('failure in paymentRejected notification does not fail admin reject', async () => {
      const repo = {
        rejectManualPaymentAsServiceRole: jest.fn().mockResolvedValue({ok: true})
      } as unknown as AdminPaymentsRepository;

      notifications.paymentRejected.mockRejectedValue(new Error('notification error'));

      const service = new AdminPaymentsService(repo, logger, notifications);
      const res = await service.reject(adminId, orderId, rejectBody);

      expect(res).toEqual({ok: true});
      expect(notifications.paymentRejected).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith('failed to dispatch paymentRejected notification');
    });
  });

  describe('Auto-confirm in PaymentEvents wiring', () => {
    const secret = 'payment-events-secret-test-32chars';
    const config = {
      paymentEventsSecret: secret,
      easyconfirmApiKey: undefined,
      easyconfirmSignatureHeader: 'x-signature',
      easyconfirmTimestampHeader: 'x-timestamp'
    } as unknown as AppConfigService;

    function buildRequest() {
      const raw = Buffer.from(JSON.stringify({
        id: 'ext-123',
        amount: '100.00',
        currency: 'EGP',
        received_at: new Date().toISOString()
      }));
      const ts = String(Math.floor(Date.now() / 1000));
      const sig = createHmac('sha256', secret).update(`${ts}.`).update(raw).digest('hex');
      const headers = {'x-timestamp': ts, 'x-signature': sig};
      return {raw, headers};
    }

    it('calls paymentConfirmed once when payment event auto-confirms an order', async () => {
      const db = {
        asService: jest.fn(async (cb: (tx: any) => Promise<any>) => {
          const tx = jest.fn().mockImplementation((query: any) => {
            const sql = typeof query === 'string' ? query : query?.join?.('');
            if (sql?.includes('pg_advisory_xact_lock')) return Promise.resolve([]);
            if (sql?.includes('insert into public.payment_events')) return Promise.resolve([{id: 'event-id'}]);
            if (sql?.includes('select o.id')) return Promise.resolve([{
              id: 'order-matched-123',
              reference: null,
              amountMinor: 10000,
              extraMinor: null,
              currency: 'EGP',
              createdAt: new Date(Date.now() - 3600_000).toISOString(),
              provider: 'manual',
              status: 'pending'
            }]);
            if (sql?.includes('system_confirm_payment')) return Promise.resolve([{result: {ok: true, already: false}}]);
            if (sql?.includes('update public.payment_events')) return Promise.resolve([]);
            return Promise.resolve([]);
          });
          return cb(tx);
        })
      };

      const repo = new PaymentEventsRepository(db as any, notifications);
      const parsedEvent = {
        externalId: 'ext-123',
        amountMinor: 10000,
        currency: 'EGP',
        receivedAt: new Date(Date.now() - 1800_000).toISOString()
      };
      const res = await repo.ingestAsServiceRole('generic-hmac', parsedEvent as any, '{}');
      expect(res).toEqual({ok: true});
      expect(notifications.paymentConfirmed).toHaveBeenCalledTimes(1);
      expect(notifications.paymentConfirmed).toHaveBeenCalledWith('order-matched-123');
    });

    it('never calls paymentConfirmed on duplicate or unmatched payment event', async () => {
      const db = {
        asService: jest.fn(async (cb: (tx: any) => Promise<any>) => {
          const tx = jest.fn().mockImplementation((query: any) => {
            const sql = typeof query === 'string' ? query : query?.join?.('');
            if (sql?.includes('pg_advisory_xact_lock')) return Promise.resolve([]);
            if (sql?.includes('insert into public.payment_events')) return Promise.resolve([]);
            return Promise.resolve([]);
          });
          return cb(tx);
        })
      };

      const repo = new PaymentEventsRepository(db as any, notifications);
      const parsedEvent = {
        externalId: 'ext-dup',
        amountMinor: 10000,
        currency: 'EGP',
        receivedAt: new Date().toISOString()
      };
      const res = await repo.ingestAsServiceRole('generic-hmac', parsedEvent as any, '{}');
      expect(res).toEqual({ok: true, duplicate: true});
      expect(notifications.paymentConfirmed).not.toHaveBeenCalled();
    });

    it('failure in paymentConfirmed does not fail event receipt', async () => {
      const db = {
        asService: jest.fn(async (cb: (tx: any) => Promise<any>) => {
          const tx = jest.fn().mockImplementation((query: any) => {
            const sql = typeof query === 'string' ? query : query?.join?.('');
            if (sql?.includes('pg_advisory_xact_lock')) return Promise.resolve([]);
            if (sql?.includes('insert into public.payment_events')) return Promise.resolve([{id: 'event-id'}]);
            if (sql?.includes('select o.id')) return Promise.resolve([{
              id: 'order-matched-123',
              reference: null,
              amountMinor: 10000,
              extraMinor: null,
              currency: 'EGP',
              createdAt: new Date(Date.now() - 3600_000).toISOString(),
              provider: 'manual',
              status: 'pending'
            }]);
            if (sql?.includes('system_confirm_payment')) return Promise.resolve([{result: {ok: true, already: false}}]);
            if (sql?.includes('update public.payment_events')) return Promise.resolve([]);
            return Promise.resolve([]);
          });
          return cb(tx);
        })
      };

      notifications.paymentConfirmed.mockRejectedValue(new Error('notification error'));

      const repo = new PaymentEventsRepository(db as any, notifications);
      const parsedEvent = {
        externalId: 'ext-123',
        amountMinor: 10000,
        currency: 'EGP',
        receivedAt: new Date(Date.now() - 1800_000).toISOString()
      };
      const res = await repo.ingestAsServiceRole('generic-hmac', parsedEvent as any, '{}');
      expect(res).toEqual({ok: true});
      expect(notifications.paymentConfirmed).toHaveBeenCalledTimes(1);
    });
  });

  describe('Daily expiry in LifecycleService wiring', () => {
    it('calls orderExpired for each returned expired order id', async () => {
      const repo = {
        dueRemindersAsServiceRole: jest.fn().mockResolvedValue([]),
        endExpiredAsServiceRole: jest.fn().mockResolvedValue(0),
        purgeAndArchiveAsServiceRole: jest.fn().mockResolvedValue({purged: 0, archived: 0}),
        expirePointsAsServiceRole: jest.fn().mockResolvedValue(0),
        expireStaleManualOrdersAsServiceRole: jest.fn().mockResolvedValue(['order-1', 'order-2', 'order-3'])
      } as unknown as LifecycleRepository;

      const notifPort = {
        sendEndReminder: jest.fn().mockResolvedValue(undefined)
      } as unknown as NotificationsPort;

      const service = new LifecycleService(repo, notifPort, logger, notifications);
      const summary = await service.runDaily(new Date());

      expect(summary.ordersExpired).toBe(3);
      expect(notifications.orderExpired).toHaveBeenCalledTimes(3);
      expect(notifications.orderExpired).toHaveBeenCalledWith('order-1');
      expect(notifications.orderExpired).toHaveBeenCalledWith('order-2');
      expect(notifications.orderExpired).toHaveBeenCalledWith('order-3');
    });

    it('does not fail the lifecycle run if orderExpired throws', async () => {
      const repo = {
        dueRemindersAsServiceRole: jest.fn().mockResolvedValue([]),
        endExpiredAsServiceRole: jest.fn().mockResolvedValue(0),
        purgeAndArchiveAsServiceRole: jest.fn().mockResolvedValue({purged: 0, archived: 0}),
        expirePointsAsServiceRole: jest.fn().mockResolvedValue(0),
        expireStaleManualOrdersAsServiceRole: jest.fn().mockResolvedValue(['order-1'])
      } as unknown as LifecycleRepository;

      const notifPort = {
        sendEndReminder: jest.fn().mockResolvedValue(undefined)
      } as unknown as NotificationsPort;

      notifications.orderExpired.mockRejectedValue(new Error('delivery down'));

      const service = new LifecycleService(repo, notifPort, logger, notifications);
      const summary = await service.runDaily(new Date());

      expect(summary.ordersExpired).toBe(1);
      expect(summary.errors).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith('failed to dispatch orderExpired notification');
    });

    it('never calls orderExpired when expiry query fails', async () => {
      const repo = {
        dueRemindersAsServiceRole: jest.fn().mockResolvedValue([]),
        endExpiredAsServiceRole: jest.fn().mockResolvedValue(0),
        purgeAndArchiveAsServiceRole: jest.fn().mockResolvedValue({purged: 0, archived: 0}),
        expirePointsAsServiceRole: jest.fn().mockResolvedValue(0),
        expireStaleManualOrdersAsServiceRole: jest.fn().mockRejectedValue(new Error('db down'))
      } as unknown as LifecycleRepository;

      const notifPort = {
        sendEndReminder: jest.fn().mockResolvedValue(undefined)
      } as unknown as NotificationsPort;

      const service = new LifecycleService(repo, notifPort, logger, notifications);
      const summary = await service.runDaily(new Date());

      expect(summary.ordersExpired).toBe(0);
      expect(summary.errors).toEqual(['expire_orders']);
      expect(notifications.orderExpired).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle reminder adapter', () => {
    it('delegates to notifications.endReminder in production when notifications are enabled', async () => {
      const config = {isProduction: true, notificationsEmailEnabled: true} as unknown as AppConfigService;
      const logAdapter = {sendEndReminder: jest.fn().mockResolvedValue(undefined)};

      const adapter = (config.isProduction && config.notificationsEmailEnabled)
        ? {
            sendEndReminder: (ownerId: string, invitationId: string, onlineUntil: Date) =>
              notifications.endReminder(ownerId, invitationId, onlineUntil)
          }
        : logAdapter;

      const date = new Date('2026-06-01');
      await adapter.sendEndReminder('owner-1', 'inv-1', date);
      expect(notifications.endReminder).toHaveBeenCalledWith('owner-1', 'inv-1', date);
    });

    it('falls back to log adapter when not in production or disabled', async () => {
      const config = {isProduction: false, notificationsEmailEnabled: true} as unknown as AppConfigService;
      const logAdapter = {sendEndReminder: jest.fn().mockResolvedValue(undefined)};

      const adapter = (config.isProduction && config.notificationsEmailEnabled)
        ? {
            sendEndReminder: (ownerId: string, invitationId: string, onlineUntil: Date) =>
              notifications.endReminder(ownerId, invitationId, onlineUntil)
          }
        : logAdapter;

      const date = new Date('2026-06-01');
      await adapter.sendEndReminder('owner-1', 'inv-1', date);
      expect(notifications.endReminder).not.toHaveBeenCalled();
      expect(logAdapter.sendEndReminder).toHaveBeenCalledWith('owner-1', 'inv-1', date);
    });
  });
});

