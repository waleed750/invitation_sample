/* eslint-disable */
import {AppLogger} from '../common/app-logger';
import {LifecycleRepository} from './lifecycle.repository';
import {LifecycleService} from './lifecycle.service';

const NOW = new Date('2026-06-01T00:00:00.000Z');

function ok(data: unknown) {
  return {data, error: null};
}

function setup(overrides: {
  due?: unknown;
  end?: unknown;
  purge?: unknown;
  expire?: unknown;
  orders?: unknown;
  notify?: (ownerId: string, invitationId: string, onlineUntil: Date) => Promise<void>;
} = {}) {
  const calls: string[] = [];
  const repository = {
    dueRemindersAsServiceRole: jest.fn(async (now: Date) => {
      calls.push(`due:${now.toISOString()}`);
      return ok(overrides.due ?? []);
    }),
    markRemindedAsServiceRole: jest.fn(async (invitationId: string, now: Date) => {
      calls.push(`mark:${invitationId}:${now.toISOString()}`);
      return {data: null, error: null};
    }),
    endExpiredAsServiceRole: jest.fn(async (now: Date) => {
      calls.push(`end:${now.toISOString()}`);
      if (overrides.end instanceof Error) throw overrides.end;
      return ok(overrides.end ?? 0);
    }),
    purgeAndArchiveAsServiceRole: jest.fn(async (now: Date) => {
      calls.push(`purge:${now.toISOString()}`);
      if (overrides.purge instanceof Error) throw overrides.purge;
      return ok(overrides.purge ?? {purged: 0, archived: 0});
    }),
    expirePointsAsServiceRole: jest.fn(async (now: Date) => {
      calls.push(`expire:${now.toISOString()}`);
      if (overrides.expire instanceof Error) throw overrides.expire;
      return ok(overrides.expire ?? 0);
    }),
    expireStaleManualOrdersAsServiceRole: jest.fn(async () => {
      calls.push('orders');
      if (overrides.orders instanceof Error) throw overrides.orders;
      return ok(overrides.orders ?? 0);
    })
  } as unknown as LifecycleRepository;
  const notifications = {
    sendEndReminder: jest.fn(async (ownerId: string, invitationId: string, onlineUntil: Date) => {
      calls.push(`notify:${invitationId}`);
      if (overrides.notify) await overrides.notify(ownerId, invitationId, onlineUntil);
    })
  };
  const logger = {log: jest.fn(), error: jest.fn()} as unknown as AppLogger;
  const service = new LifecycleService(repository, notifications, logger);
  return {service, repository, notifications, logger, calls};
}

const REMINDER_ROW = {invitation_id: 'inv-1', owner_id: 'owner-1', online_until: '2026-06-07T00:00:00.000Z'};

describe('LifecycleService.runDaily', () => {
  it('records a failing manual-order expiry without hiding earlier results', async () => {
    const {service} = setup({end: 1, orders: new Error('db down')});
    const summary = await service.runDaily(NOW);
    expect(summary.ended).toBe(1);
    expect(summary.ordersExpired).toBe(0);
    expect(summary.errors).toEqual(['expire_orders']);
  });

  it('runs the steps in order with the given now and aggregates the summary', async () => {
    const {service, calls} = setup({
      due: [REMINDER_ROW, {invitation_id: 'inv-2', owner_id: 'owner-2', online_until: '2026-06-07T12:00:00.000Z'}],
      end: 3,
      purge: {purged: 4, archived: 2},
      expire: 5,
      orders: 6
    });
    const summary = await service.runDaily(NOW);
    expect(summary).toEqual({reminded: 2, ended: 3, purged: 4, archived: 2, pointsExpired: 5, ordersExpired: 6, errors: []});
    expect(calls).toEqual([
      `due:${NOW.toISOString()}`,
      'notify:inv-1',
      `mark:inv-1:${NOW.toISOString()}`,
      'notify:inv-2',
      `mark:inv-2:${NOW.toISOString()}`,
      `end:${NOW.toISOString()}`,
      `purge:${NOW.toISOString()}`,
      `expire:${NOW.toISOString()}`,
      'orders'
    ]);
  });

  it('marks a reminder only after notify succeeds', async () => {
    const {service, repository, notifications} = setup({
      due: [REMINDER_ROW, {invitation_id: 'inv-2', owner_id: 'owner-2', online_until: '2026-06-07T12:00:00.000Z'}],
      notify: async (_owner, invitationId) => {
        if (invitationId === 'inv-1') throw new Error('channel down');
      }
    });
    const summary = await service.runDaily(NOW);
    expect(summary.reminded).toBe(1);
    expect(summary.errors).toEqual(['reminder']);
    expect(notifications.sendEndReminder).toHaveBeenCalledTimes(2);
    expect(repository.markRemindedAsServiceRole).toHaveBeenCalledTimes(1);
    expect(repository.markRemindedAsServiceRole).toHaveBeenCalledWith('inv-2', NOW);
  });

  it('a failing step does not stop later steps and is recorded', async () => {
    const {service, repository, logger} = setup({
      due: [],
      end: new Error('db down'),
      purge: {purged: 1, archived: 1},
      expire: 2
    });
    const summary = await service.runDaily(NOW);
    expect(summary).toEqual({reminded: 0, ended: 0, purged: 1, archived: 1, pointsExpired: 2, ordersExpired: 0, errors: ['end']});
    expect(repository.expireStaleManualOrdersAsServiceRole).toHaveBeenCalledTimes(1);
    expect(repository.purgeAndArchiveAsServiceRole).toHaveBeenCalledWith(NOW);
    expect(repository.expirePointsAsServiceRole).toHaveBeenCalledWith(NOW);
    expect(logger.error).toHaveBeenCalledWith('lifecycle end step failed');
  });

  it('a broken reminders payload fails only that step', async () => {
    const {service, repository} = setup({due: {data: 'not-an-array'} as any, end: 1});
    const summary = await service.runDaily(NOW);
    expect(summary.ended).toBe(1);
    expect(summary.errors).toEqual(['reminders']);
    expect(repository.endExpiredAsServiceRole).toHaveBeenCalledWith(NOW);
  });

  it('skips unreadable reminder rows but still processes the rest', async () => {
    const {service, repository} = setup({due: [{invitation_id: 'inv-9'}, REMINDER_ROW]});
    const summary = await service.runDaily(NOW);
    expect(summary.reminded).toBe(1);
    expect(summary.errors).toEqual(['reminder']);
    expect(repository.markRemindedAsServiceRole).toHaveBeenCalledTimes(1);
    expect(repository.markRemindedAsServiceRole).toHaveBeenCalledWith('inv-1', NOW);
  });
});
