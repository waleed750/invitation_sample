import {createHmac} from 'node:crypto';
import {EasyConfirmProvider} from './easyconfirm.provider';
import {GenericHmacProvider, parseAmountMinor} from './generic-hmac.provider';

const SECRET = 'test-payment-events-secret-32-characters';
const NOW = 1_800_000_000_000;
const payload = {id: 'transfer-1', amount: '1299.37', currency: 'EGP', sender: 'Sender', note: 'INV-ABC123', received_at: new Date(NOW).toISOString()};
function signed(body = JSON.stringify(payload), timestamp = String(NOW / 1000)) {
  const raw = Buffer.from(body);
  return {raw, headers: {'x-timestamp': timestamp, 'x-signature': createHmac('sha256', SECRET).update(`${timestamp}.`).update(raw).digest('hex')}};
}

describe('decimal amounts', () => {
  it.each([['1299.37', 129937], ['1,299.37', 129937], [1299.37, 129937], [0.29, 29], ['0', 0], ['1.2', 120], ['90071992547409.91', Number.MAX_SAFE_INTEGER]])('parses %s exactly', (value, expected) => {
    expect(parseAmountMinor(value)).toBe(expected);
  });
  it.each(['1,29.37', '12,34,567', '-1', '1.001', '1e3', 'NaN', 'Infinity', '', '90071992547409.92'])('rejects %s', (value) => {
    expect(() => parseAmountMinor(value)).toThrow();
  });
});

describe('generic HMAC provider', () => {
  const adapter = new GenericHmacProvider(SECRET, 'x-signature', 'x-timestamp', undefined, () => NOW);
  it('verifies exact bytes and maps the payload', () => {
    const {raw, headers} = signed(JSON.stringify(payload, null, 2));
    expect(adapter.verify(raw, headers)).toEqual({externalId: 'transfer-1', amountMinor: 129937, currency: 'EGP', sender: 'Sender', referenceText: 'INV-ABC123', receivedAt: payload.received_at});
  });
  it.each([
    ['1299.37', 129937], ['0.29', 29], ['90071992547409.91', Number.MAX_SAFE_INTEGER]
  ])('converts numeric JSON token %s without losing precision', (token, expected) => {
    const body = JSON.stringify(payload).replace('"1299.37"', token);
    const {raw, headers} = signed(body);
    expect(adapter.verify(raw, headers).amountMinor).toBe(expected);
  });
  it.each(['90071992547409.92', '1299.3700000000000000001'])('rejects numeric token %s before JSON rounding hides invalid precision', (token) => {
    const body = JSON.stringify(payload).replace('"1299.37"', token);
    const {raw, headers} = signed(body);
    expect(() => adapter.verify(raw, headers)).toThrow();
  });
  it('rejects a changed body', () => {
    const {headers} = signed();
    expect(() => adapter.verify(Buffer.from('{}'), headers)).toThrow();
  });
  it.each(['00', 'z'.repeat(64), '0'.repeat(64)])('rejects bad signature %s', (signature) => {
    const {raw, headers} = signed();
    expect(() => adapter.verify(raw, {...headers, 'x-signature': signature})).toThrow();
  });
  it.each([-301, 301])('rejects timestamp offset %s', (offset) => {
    const {raw, headers} = signed(undefined, String(NOW / 1000 + offset));
    expect(() => adapter.verify(raw, headers)).toThrow();
  });
  it.each([-300, 300])('accepts replay boundary %s', (offset) => {
    const {raw, headers} = signed(undefined, String(NOW / 1000 + offset));
    expect(adapter.verify(raw, headers).externalId).toBe('transfer-1');
  });
  it.each(['{', 'null', '[]', '{}', JSON.stringify({...payload, amount: '1.234'}), JSON.stringify({...payload, currency: 'egp'}), JSON.stringify({...payload, received_at: 'yesterday'})])('rejects signed malformed payload %s', (body) => {
    const {raw, headers} = signed(body);
    expect(() => adapter.verify(raw, headers)).toThrow();
  });
  it('rejects absent, duplicate and nonnumeric headers', () => {
    const {raw, headers} = signed();
    for (const bad of [{}, {...headers, 'x-signature': [headers['x-signature']]}, {...headers, 'x-timestamp': 'NaN'}]) {
      expect(() => adapter.verify(raw, bad)).toThrow();
    }
  });
  it.each([undefined, '', 'short'])('refuses missing/short secret', (secret) => {
    const {raw, headers} = signed();
    expect(() => new GenericHmacProvider(secret).verify(raw, headers)).toThrow();
  });
});

describe('provisional EasyConfirm', () => {
  it('requires both an API key and signing secret', () => {
    const {raw, headers} = signed();
    expect(() => new EasyConfirmProvider(undefined, SECRET).verify(raw, headers)).toThrow();
    expect(() => new EasyConfirmProvider('key', undefined).verify(raw, headers)).toThrow();
  });
  it('uses configurable header names and the provisional mapping', () => {
    const {raw, headers} = signed(undefined, String(Math.floor(Date.now() / 1000)));
    const adapter = new EasyConfirmProvider('configured-key', SECRET, 'X-Easy-Sig', 'X-Easy-Time');
    expect(adapter.verify(raw, {'x-easy-sig': headers['x-signature'], 'x-easy-time': headers['x-timestamp']}).amountMinor).toBe(129937);
  });
});
