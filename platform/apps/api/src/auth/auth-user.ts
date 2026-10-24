/** The slice of `pg.Pool` this module needs (kept small so it can be unit tested). */
export interface AuthUserPool {
  connect(): Promise<AuthUserClient>;
}

export interface AuthUserClient {
  query(sql: string, params?: unknown[]): Promise<unknown>;
  release(): void;
}

/**
 * Mirrors a Better Auth user into `auth.users`, whose trigger (0013) creates the
 * matching `profiles` row. Idempotent, and safe to call on every sign-in.
 *
 * The API connects as the login role `app_api`, which has no privileges on the
 * `auth` schema of its own, so the insert runs as `service_role` (the same role
 * the API's service-level data access uses).
 */
export async function ensureAuthUser(pool: AuthUserPool, userId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('begin');
    // Read the Better Auth user as app_api (service_role has no access to that schema)...
    const found = (await client.query(
      `select id, email, "phoneNumber" as phone, name from better_auth."user" where id = $1::uuid`,
      [userId]
    )) as {rows?: {id: string; email: string | null; phone: string | null; name: string | null}[]};
    const user = found.rows?.[0];
    if (user === undefined) throw new Error('better_auth user not found');
    // ...then write auth.users as service_role.
    await client.query('set local role service_role');
    await client.query(
      `insert into auth.users (id, aud, role, email, phone, raw_user_meta_data, raw_app_meta_data)
       values ($1::uuid, 'authenticated', 'authenticated', $2, $3, $4::jsonb, $5::jsonb)
       on conflict (id) do nothing`,
      [user.id, user.email, user.phone, JSON.stringify({name: user.name}), JSON.stringify({provider: 'email'})]
    );
    await client.query('commit');
  } catch (error) {
    await client.query('rollback').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
