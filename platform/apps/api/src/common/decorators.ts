import {createParamDecorator, ExecutionContext, InternalServerErrorException, SetMetadata} from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route (or controller) as public — the global `AuthGuard` skips it. */
export const Public = (): ReturnType<typeof SetMetadata> => SetMetadata(IS_PUBLIC_KEY, true);

export type UserRole = 'admin' | 'customer';

export const ROLES_KEY = 'roles';

/** Requires one of the given `profiles.role` values — enforced by `RolesGuard`. */
export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> => SetMetadata(ROLES_KEY, roles);

/** The authenticated caller, attached to the request by `AuthGuard`. */
export interface RequestUser {
  /** Better Auth `user.id`. */
  id: string;
  email?: string;
  phone?: string;
  /** The raw bearer token, used by L1 for now. */
  jwt: string;
}

export interface AuthenticatedRequest {
  user?: RequestUser;
  /** Role loaded from `profiles` by `RolesGuard`, cached on the request (never shared across requests). */
  profileRole?: string | null;
}

/** Extracts the authenticated caller. Fails loudly if the guard did not run. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): RequestUser => {
  const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
  if (req.user === undefined) {
    throw new InternalServerErrorException('CurrentUser used on a route without an authenticated user');
  }
  return req.user;
});
