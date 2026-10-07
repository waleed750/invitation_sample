/* eslint-disable */
import {AppLogger} from '../common/app-logger';
import {AppConfigService} from '../config/app-config.service';
import {LifecycleScheduler} from './lifecycle.scheduler';
import {LifecycleService} from './lifecycle.service';

const NOW = new Date('2026-06-01T00:00:00.000Z');

function setup(overrides: {nodeEnv?: string; lifecycleCronEnabled?: boolean} = {}) {
  const lifecycle = {runDaily: jest.fn(async () => ({reminded: 1, ended: 2, purged: 0, archived: 0, pointsExpired: 3, errors: []}))} as unknown as LifecycleService;
  const config = {
    nodeEnv: overrides.nodeEnv ?? 'production',
    lifecycleCronEnabled: overrides.lifecycleCronEnabled ?? true
  } as AppConfigService;
  const clock = {now: () => NOW};
  const logger = {log: jest.fn(), error: jest.fn()} as unknown as AppLogger;
  const scheduler = new LifecycleScheduler(lifecycle, config, clock, logger);
  return {scheduler, lifecycle, logger};
}

describe('LifecycleScheduler', () => {
  it('is disabled in the test env', async () => {
    const {scheduler, lifecycle} = setup({nodeEnv: 'test'});
    expect(scheduler.cronEnabled()).toBe(false);
    await scheduler.handleCron();
    expect(lifecycle.runDaily).not.toHaveBeenCalled();
  });

  it('is disabled when LIFECYCLE_CRON_ENABLED=false', async () => {
    const {scheduler, lifecycle} = setup({nodeEnv: 'production', lifecycleCronEnabled: false});
    expect(scheduler.cronEnabled()).toBe(false);
    await scheduler.handleCron();
    expect(lifecycle.runDaily).not.toHaveBeenCalled();
  });

  it('runs daily with the clock time and logs the summary (counts only)', async () => {
    const {scheduler, lifecycle, logger} = setup({nodeEnv: 'production', lifecycleCronEnabled: true});
    expect(scheduler.cronEnabled()).toBe(true);
    await scheduler.handleCron();
    expect(lifecycle.runDaily).toHaveBeenCalledWith(NOW);
    expect(logger.log).toHaveBeenCalledTimes(1);
    const line = (logger.log as jest.Mock).mock.calls[0][0] as string;
    expect(line).toContain('reminded=1');
    expect(line).toContain('ended=2');
    expect(line).toContain('pointsExpired=3');
  });
});
