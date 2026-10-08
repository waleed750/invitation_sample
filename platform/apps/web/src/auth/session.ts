/**
 * Server-side view of the signed-in user, shared by the commerce API client,
 * the admin screens and route handlers.
 *
 * Contract (do not change the shape without updating every caller):
 *  - `accessToken` is the Supabase access token (JWT) the NestJS API verifies.
 *  - Returns `null` when nobody is signed in or the session cannot be read.
 *
 * Implemented in W1 (Supabase SSR cookies); this stub keeps dependants compiling.
 */
export interface AuthSession {
  accessToken: string;
  userId: string;
  email?: string;
  phone?: string;
}

export async function getServerSession(): Promise<AuthSession | null> {
  return null;
}
