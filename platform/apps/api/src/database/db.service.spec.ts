import type postgres from 'postgres';
import {DbService, type Tx} from './db.service';

interface Call {
  text: string;
  params: unknown[];
}

function makeFake() {
  const calls: Call[] = [];
  const raw = (strings: TemplateStringsArray, ...params: unknown[]) => {
    calls.push({text: strings.join('?').trim(), params});
    return Promise.resolve([]);
  };
  const sql = {
    begin: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(raw)),
    end: jest.fn(() => Promise.resolve())
  };
  return {calls, sql, service: new DbService(sql as unknown as postgres.Sql)};
}

describe('DbService', () => {
  it('asUser sets the role and passes claims as a bind parameter', async () => {
    const {calls, service, sql} = makeFake();
    const out = await service.asUser({id: 'u-1', role: 'admin'}, async (tx: Tx) => {
      await tx`select 1 where ${'x'} = ${'x'}`;
      return 'done';
    });
    expect(out).toBe('done');
    expect(sql.begin).toHaveBeenCalledTimes(1);
    expect(calls[0]).toEqual({text: 'set local role authenticated', params: []});
    expect(calls[1]).toEqual({
      text: "select set_config('request.jwt.claims', ?, true)",
      params: [JSON.stringify({sub: 'u-1', role: 'authenticated'})]
    });
    expect(calls[2]?.params).toEqual(['x', 'x']);
  });

  it('never interpolates hostile ids into SQL text', async () => {
    const {calls, service} = makeFake();
    const evil = `x'); drop table profiles; --`;
    await service.asUser({id: evil}, () => Promise.resolve());
    for (const call of calls) expect(call.text).not.toContain('drop table');
    expect(calls[1]?.params[0]).toBe(JSON.stringify({sub: evil, role: 'authenticated'}));
  });

  it('asService and asAnon only switch role', async () => {
    const svc = makeFake();
    await svc.service.asService(() => Promise.resolve());
    expect(svc.calls.map((c) => c.text)).toEqual(['set local role service_role']);

    const anon = makeFake();
    await anon.service.asAnon(() => Promise.resolve());
    expect(anon.calls.map((c) => c.text)).toEqual(['set local role anon']);
  });

  it('propagates errors from the callback (transaction rolls back)', async () => {
    const {service} = makeFake();
    await expect(service.asAnon(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
  });

  it('exposes only the tagged template to repositories', async () => {
    const {service} = makeFake();
    await service.asService((tx) => {
      expect(typeof tx).toBe('function');
      expect(Object.keys(tx)).toEqual([]);
      expect((tx as unknown as Record<string, unknown>).unsafe).toBeUndefined();
      return Promise.resolve();
    });
  });

  it('ends the pool on module destroy', async () => {
    const {service, sql} = makeFake();
    await service.onModuleDestroy();
    expect(sql.end).toHaveBeenCalledWith({timeout: 5});
  });
});
