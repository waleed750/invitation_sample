import {createHmac} from 'node:crypto';
import {ConfigService} from '@nestjs/config';
import {AppConfigService} from '../config/app-config.service';
import {PaymentEventsRepository} from './payment-events.repository';
import {paymentFailure, PaymentEventsService} from './payment-events.service';
import {UniqueAmountService} from './unique-amount.service';
import {validateEnv} from '../config/env.schema';
import {BASE_ENV} from '../testing/env';
const ID = '16000000-0000-4000-8000-000000000001';
const SECRET = 'payment-events-test-secret-long-enough';

function setup() {
  const repository = {
    ingestAsServiceRole: jest.fn().mockResolvedValue({ok: true}),
    assignAsServiceRole: jest.fn().mockResolvedValue({ok: true}),
    allocateAsServiceRole: jest.fn().mockResolvedValue({amount_minor: 129937, extra_minor: 37}),
    listAsServiceRole: jest.fn().mockResolvedValue([])
  };
  const config = new AppConfigService(new ConfigService({PAYMENT_EVENTS_SECRET: SECRET}));
  const repo = repository as unknown as PaymentEventsRepository;
  return {repository, service: new PaymentEventsService(repo, config), unique: new UniqueAmountService(repo)};
}
function notification() {
  const raw = Buffer.from(JSON.stringify({id: 'txn', amount: '1,299.37', currency: 'EGP', received_at: new Date().toISOString()}, null, 2));
  const timestamp = String(Math.floor(Date.now() / 1000));
  const headers = {'x-timestamp': timestamp, 'x-signature': createHmac('sha256', SECRET).update(`${timestamp}.`).update(raw).digest('hex')};
  return {raw, headers};
}

describe('PaymentEventsService', () => {
  it('verifies raw bytes before storing parsed event and original JSON', async () => {
    const {service, repository} = setup(); const {raw, headers} = notification();
    await expect(service.receive('generic-hmac', raw, headers)).resolves.toEqual({ok: true});
    expect(repository.ingestAsServiceRole).toHaveBeenCalledWith('generic-hmac', expect.objectContaining({amountMinor: 129937}), raw.toString('utf8'));
  });
  it('returns 200-compatible duplicate shape without rematching', async () => {
    const {service, repository} = setup(); const {raw, headers} = notification();
    repository.ingestAsServiceRole.mockResolvedValue({ok: true, duplicate: true});
    await expect(service.receive('generic-hmac', raw, headers)).resolves.toEqual({ok: true, duplicate: true});
  });
  it('returns identical 401 messages without leaking signature details', async () => {
    const {service, repository} = setup(); const {raw, headers} = notification();
    for (const body of [Buffer.alloc(0), raw]) {
      await expect(service.receive('generic-hmac', body, {})).rejects.toMatchObject({status: 401, message: 'Invalid payment notification'});
    }
    await expect(service.receive('easyconfirm', raw, headers)).rejects.toMatchObject({status: 401, message: 'Invalid payment notification'});
    expect(repository.ingestAsServiceRole).not.toHaveBeenCalled();
  });
  it('does not expose database failures', async () => {
    const {service, repository} = setup(); const {raw, headers} = notification();
    repository.ingestAsServiceRole.mockRejectedValue(new Error('credential=private-secret'));
    await expect(service.receive('generic-hmac', raw, headers)).rejects.toMatchObject({status: 503, message: 'Payments service unavailable'});
  });
  it('passes actor, event, order and note to assignment', async () => {
    const {service, repository} = setup();
    await expect(service.assign('admin', 'event', ID, 'reviewed')).resolves.toEqual({ok: true, already: false});
    expect(repository.assignAsServiceRole).toHaveBeenCalledWith('admin', 'event', ID, 'reviewed');
  });
  it('preserves idempotent assignment', async () => {
    const {service, repository} = setup(); repository.assignAsServiceRole.mockResolvedValue({ok: true, already: true});
    await expect(service.assign('admin', 'event', ID, 'reviewed')).resolves.toEqual({ok: true, already: true});
  });
  it.each(['amount_mismatch', 'not_pending'])('maps %s to 409', async (reason) => {
    const {service, repository} = setup(); repository.assignAsServiceRole.mockResolvedValue({ok: false, reason});
    await expect(service.assign('admin', 'event', ID, 'reviewed')).rejects.toMatchObject({status: 409});
  });
  it('maps missing rows to 404', () => { expect(paymentFailure('not_found')).toMatchObject({status: 404}); });
  it('maps SQL admin denial to 403', () => { expect(paymentFailure('not_admin')).toMatchObject({status: 403}); });
  it('bounds the list through the validated caller', async () => {
    const {service, repository} = setup(); await expect(service.list('ambiguous', 50)).resolves.toEqual([]);
    expect(repository.listAsServiceRole).toHaveBeenCalledWith('ambiguous', 50);
  });
});

describe('UniqueAmountService', () => {
  it('exports camelCase checkout amounts', async () => {
    const {unique, repository} = setup();
    await expect(unique.allocate(ID)).resolves.toEqual({amountMinor: 129937, extraMinor: 37});
    expect(repository.allocateAsServiceRole).toHaveBeenCalledWith(ID);
  });
  it('maps slot exhaustion to 409', async () => {
    const {unique, repository} = setup(); repository.allocateAsServiceRole.mockResolvedValue({ok: false, reason: 'no_slot'});
    await expect(unique.allocate(ID)).rejects.toMatchObject({status: 409});
  });
  it('rejects invalid IDs before any SQL', async () => {
    const {unique, repository} = setup(); await expect(unique.allocate('bad')).rejects.toThrow();
    expect(repository.allocateAsServiceRole).not.toHaveBeenCalled();
  });
  it('rejects malformed SQL result', async () => {
    const {unique, repository} = setup(); repository.allocateAsServiceRole.mockResolvedValue({ok: true});
    await expect(unique.allocate(ID)).rejects.toMatchObject({status: 503});
  });
});

describe('payment env additions', () => {
  it('stays disabled when unset and validates configured secret length', () => {
    expect(validateEnv(BASE_ENV).PAYMENT_EVENTS_SECRET).toBeUndefined();
    expect(() => validateEnv({...BASE_ENV, PAYMENT_EVENTS_SECRET: 'short'})).toThrow('PAYMENT_EVENTS_SECRET');
    expect(validateEnv({...BASE_ENV, PAYMENT_EVENTS_SECRET: SECRET}).PAYMENT_EVENTS_SECRET).toBe(SECRET);
  });
  it('validates configured header names', () => {
    expect(() => validateEnv({...BASE_ENV, EASYCONFIRM_SIGNATURE_HEADER: 'invalid\nheader'})).toThrow('EASYCONFIRM_SIGNATURE_HEADER');
  });
});
