/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-confusing-void-expression, @typescript-eslint/prefer-optional-chain, @typescript-eslint/prefer-nullish-coalescing */
import {CanActivate, ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {AppConfigService} from '../config/app-config.service';
import {IS_PUBLIC_KEY, type AuthenticatedRequest, type RequestUser} from '../common/decorators';
import {getBetterAuth} from './better-auth';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: AppConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<AuthenticatedRequest & {headers: Record<string, string | string[] | undefined>}>();
    
    try {
      const auth = getBetterAuth(this.config);
      // Construct a minimal Web Request or Headers object from Express headers
      // Actually better-auth api accepts raw fetch Headers
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (typeof value === 'string') {
          headers.set(key, value);
        } else if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v));
        }
      }
      
      const session = await auth.api.getSession({
        headers: headers
      });

      if (!session || !session.user || !session.user.id) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      const user: RequestUser = { 
        id: session.user.id,
        jwt: session.session?.token || ''
      };
      if (session.user.email) user.email = session.user.email;
      if (session.user.phoneNumber) user.phone = session.user.phoneNumber;
      
      req.user = user;
      return true;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
