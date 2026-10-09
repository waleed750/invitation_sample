import {Injectable} from '@nestjs/common';
import {ThrottlerGuard} from '@nestjs/throttler';
import type {Request} from 'express';
import {clientIp} from './client-ip';

/** Global throttler keyed on the real client IP (proxy-aware) instead of the proxy's socket address. */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(req: Record<string, unknown>): Promise<string> {
    return Promise.resolve(clientIp(req as unknown as Request));
  }
}
