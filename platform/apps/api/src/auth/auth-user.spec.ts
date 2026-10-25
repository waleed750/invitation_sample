import {ensureAuthUser, type AuthUserClient} from './auth-user';

function fakePool(failOn?: string) {
  const statements: string[] = [];
  let released = 0;
  const client: AuthUserClient = {
    query: (sql: string) => {
      statements.push(sql.trim().split('\n')[0] ?? '');
      if (failOn !== undefined && sql.includes(failOn)) return Promise.reject(new Error('boom'));
      if (sql.includes('from better_auth')) {
        return Promise.resolve({rows: [{id: 'u1', email: 'a@example.test', phone: null, name: 'A'}]});
      }
      return Promise.resolve({});
    },
    release: () => {
      released += 1;
    }
  };
  return {pool: {connect: () => Promise.resolve(client)}, statements, released: () => released};
}

describe('ensureAuthUser', () => {
  it('inserts as service_role inside one transaction and releases the connection', async () => {
    const {pool, statements, released} = fakePool();
    await ensureAuthUser(pool, '00000000-0000-4000-8000-000000000001');
    expect(statements[0]).toBe('begin');
    expect(statements[1]).toMatch(/^select id, email/);
    expect(statements[2]).toBe('set local role service_role');
    expect(statements[3]).toMatch(/^insert into auth\.users/);
    expect(statements.at(-1)).toBe('commit');
    expect(released()).toBe(1);
  });

  it('fails (and rolls back) when the Better Auth user does not exist', async () => {
    const statements: string[] = [];
    const pool = {
      connect: () =>
        Promise.resolve({
          query: (sql: string) => {
            statements.push(sql.trim().split('\n')[0] ?? '');
            return Promise.resolve({rows: []});
          },
          release: () => undefined
        })
    };
    await expect(ensureAuthUser(pool, 'missing')).rejects.toThrow('better_auth user not found');
    expect(statements.at(-1)).toBe('rollback');
  });

  it('rolls back, releases and rethrows when the insert fails', async () => {
    const {pool, statements, released} = fakePool('insert into auth.users');
    await expect(ensureAuthUser(pool, '00000000-0000-4000-8000-000000000001')).rejects.toThrow('boom');
    expect(statements.at(-1)).toBe('rollback');
    expect(released()).toBe(1);
  });
});
