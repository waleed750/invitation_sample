import {CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {ROLES_KEY, type AuthenticatedRequest, type UserRole} from '../common/decorators';
import {isRecord} from '../common/type-guards';
import {AuthRepository} from './auth.repository';

/**
 * Global role guard. Routes without `@Roles(...)` pass through; otherwise the
 * caller's role is read from the `profiles.role` column through the
 * user-scoped Supabase client (so RLS still decides visibility) and cached on
 * the request object — never shared across requests.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly repository: AuthRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // `| undefined`: at runtime there is no metadata when `@Roles` is absent
    // (the declared type omits it).
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (required === undefined || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;
    if (user === undefined) {
      throw new UnauthorizedException('Missing authenticated user');
    }

    let role = req.profileRole;
    if (role === undefined) {
      role = await this.loadRole(user.id, user.jwt);
      req.profileRole = role;
    }
    if (role === null || !required.includes(role as UserRole)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }

  private async loadRole(userId: string, jwt: string): Promise<string | null> {
    try {
      const result: unknown = await this.repository.findRoleByUserId(jwt, userId);
      if (!isRecord(result)) return null;
      const {data, error}: {data: unknown; error: unknown} = result as {data: unknown; error: unknown};
      if (error !== null || data === null || !isRecord(data)) return null;
      const role: unknown = data.role;
      return typeof role === 'string' ? role : null;
    } catch {
      // Unreachable Supabase: deny, the filter maps it to 403 without detail.
      return null;
    }
  }
}
