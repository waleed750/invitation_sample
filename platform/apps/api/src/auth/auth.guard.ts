import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {createRemoteJWKSet, jwtVerify, type JWTPayload} from 'jose';
import {AppConfigService} from '../config/app-config.service';
import {IS_PUBLIC_KEY, type AuthenticatedRequest, type RequestUser} from '../common/decorators';

/** Supabase JWT claims we read. Extra claims stay untouched. */
interface SupabaseJwtPayload extends JWTPayload {
  email?: unknown;
  phone?: unknown;
}

/**
 * Global authentication guard: every route is protected unless marked `@Public()`.
 *
 * Verifies `Authorization: Bearer <Supabase JWT>` with `jose`:
 * - when `SUPABASE_JWT_SECRET` is set, HS256 against that secret;
 * - otherwise the project's JWKS (`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`).
 *
 * Requires `aud === 'authenticated'` and a valid (non-expired) token; `jose`
 * enforces both and the failure is mapped to 401. On success the caller is
 * attached as `{ id: sub, email, phone, jwt }`. Tokens are never logged.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private remoteJwks: ReturnType<typeof createRemoteJWKSet> | undefined;

  constructor(
    private readonly reflector: Reflector,
    private readonly config: AppConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest & {headers: {authorization?: string}}>();
    const header = req.headers.authorization;
    const token =
      header?.startsWith('Bearer ') === true ? header.slice('Bearer '.length).trim() : undefined;
    if (token === undefined || token === '') {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: SupabaseJwtPayload;
    try {
      payload = await this.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (typeof payload.sub !== 'string' || payload.sub === '') {
      throw new UnauthorizedException('Invalid token subject');
    }
    const user: RequestUser = {id: payload.sub, jwt: token};
    if (typeof payload.email === 'string') user.email = payload.email;
    if (typeof payload.phone === 'string') user.phone = payload.phone;
    req.user = user;
    return true;
  }

  private async verify(token: string): Promise<SupabaseJwtPayload> {
    const secret = this.config.supabaseJwtSecret;
    if (secret !== undefined) {
      // HS256 with a raw shared secret (Uint8Array) — the documented jose usage.
      const key = new TextEncoder().encode(secret);
      const {payload} = await jwtVerify(token, key, {audience: 'authenticated'});
      return payload;
    }
    this.remoteJwks ??= createRemoteJWKSet(new URL(`${this.config.supabaseUrl}/auth/v1/.well-known/jwks.json`));
    const {payload} = await jwtVerify(token, this.remoteJwks, {audience: 'authenticated'});
    return payload;
  }
}
