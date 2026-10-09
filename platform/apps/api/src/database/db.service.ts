import {Inject, Injectable, type OnModuleDestroy} from '@nestjs/common';
import type postgres from 'postgres';

/** DI token for the shared postgres.js pool (provided by `DatabaseModule`). */
export const POSTGRES_POOL = Symbol('POSTGRES_POOL');

/**
 * The ONLY query surface repositories get: a tagged template. Values are always
 * sent as bind parameters. There is deliberately no `unsafe`, no `sql(obj)`
 * helper and no `begin` — the transaction (and the role switch) is owned by
 * `DbService`.
 */
export type Tx = <T extends postgres.MaybeRow[] = postgres.Row[]>(
  strings: TemplateStringsArray,
  ...params: postgres.ParameterOrFragment<never>[]
) => postgres.PendingQuery<T>;

export interface DbUser {
  id: string;
  /** Application role (customer/admin). Informational only: Postgres sees `authenticated`. */
  role?: string;
}

/**
 * Per-request database access. Every call runs in ONE transaction that first
 * drops to a restricted Postgres role (`set local role`), so RLS, grants and
 * the column-guard triggers apply exactly as they would for a direct client.
 * The login role (`app_api`) itself holds no table privileges.
 *
 * - `asUser`    -> role `authenticated`, `auth.uid()` = user.id
 * - `asAnon`    -> role `anon`
 * - `asService` -> role `service_role` (BYPASSRLS; server-side jobs/webhooks only)
 */
@Injectable()
export class DbService implements OnModuleDestroy {
  constructor(@Inject(POSTGRES_POOL) private readonly sql: postgres.Sql) {}

  asUser<T>(user: DbUser, fn: (tx: Tx) => Promise<T>): Promise<T> {
    // Claims travel as a bind parameter into set_config(), never interpolated.
    const claims = JSON.stringify({sub: user.id, role: 'authenticated'});
    return this.run(fn, async (tx) => {
      await tx`set local role authenticated`;
      await tx`select set_config('request.jwt.claims', ${claims}, true)`;
    });
  }

  asService<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.run(fn, async (tx) => {
      await tx`set local role service_role`;
    });
  }

  asAnon<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.run(fn, async (tx) => {
      await tx`set local role anon`;
    });
  }

  private async run<T>(fn: (tx: Tx) => Promise<T>, setup: (tx: Tx) => Promise<void>): Promise<T> {
    const result = await this.sql.begin(async (raw) => {
      // `unknown` bridges postgres.js's TransactionSql overloads to our narrow Tx.
      const tx: Tx = (strings, ...params) => (raw as unknown as Tx)(strings, ...params);
      await setup(tx);
      return fn(tx);
    });
    return result as T;
  }

  async onModuleDestroy(): Promise<void> {
    await this.sql.end({timeout: 5});
  }
}
