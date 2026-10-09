import {CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {ROLES_KEY, type AuthenticatedRequest, type UserRole} from '../common/decorators';
import {AuthRepository} from './auth.repository';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly repository: AuthRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      role = await this.loadRole(user.id);
      req.profileRole = role;
    }
    if (role === null || !required.includes(role as UserRole)) {
      throw new ForbiddenException('Insufficient role');
    }
    return true;
  }

  private async loadRole(userId: string): Promise<string | null> {
    try {
      const row = await this.repository.findRoleByUserId(userId);
      return row ? row.role : null;
    } catch {
      return null;
    }
  }
}
