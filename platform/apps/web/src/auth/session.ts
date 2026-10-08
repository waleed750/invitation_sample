import {createSupabaseServerClient} from './supabase-server';

/**
 * Server-side view of the signed-in user, shared by the commerce API client,
 * the admin screens and route handlers.
 *
 * Contract (do not change the shape without updating every caller):
 *  - `accessToken` is the Supabase access token (JWT) the NestJS API verifies.
 *  - Returns `null` when nobody is signed in or the session cannot be read.
 */
export interface AuthSession {
  accessToken: string;
  userId: string;
  email?: string;
  phone?: string;
}

/** Minimal structural slice of the Supabase client, so it can be mocked. */
export interface SessionSource {
  auth: {
    getUser(): Promise<{data: {user: {id: string; email?: string | null; phone?: string | null} | null}; error: unknown}>;
    getSession(): Promise<{data: {session: {access_token?: string} | null}}>;
  };
}

export async function sessionFromClient(supabase: SessionSource): Promise<AuthSession | null> {
  try {
    // getUser() revalidates the JWT with Supabase; cookie contents alone are not trusted.
    const {data: {user}, error} = await supabase.auth.getUser();
    if (error || !user) return null;
    const {data: {session}} = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    return {
      accessToken: session.access_token,
      userId: user.id,
      ...(user.email ? {email: user.email} : {}),
      ...(user.phone ? {phone: user.phone} : {})
    };
  } catch {
    return null;
  }
}

export async function getServerSession(): Promise<AuthSession | null> {
  const supabase = await createSupabaseServerClient();
  return supabase ? sessionFromClient(supabase) : null;
}
