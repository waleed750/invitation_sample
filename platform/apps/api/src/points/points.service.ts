import {Injectable, ServiceUnavailableException} from '@nestjs/common';
import {levelForPurchases, type Level} from '@platform/shared';
import {AppLogger} from '../common/app-logger';
import type {RequestUser} from '../common/decorators';
import {isRecord} from '../common/type-guards';
import {PointsRepository} from './points.repository';

export interface PointsResponse {
  balance: number;
  purchaseCount: number;
  level: Level;
  /** Points a new order may redeem now (the balance minus what other open orders already hold). */
  spendable: number;
  /** What the balance will lose in the next `days` days as points expire (0 when nothing). */
  expiringSoon: {points: number; firstExpiry: string | null; days: number};
  /** The customer's invite link code and what it earned. */
  referral: {code: string | null; invited: number; rewarded: number; rewardPoints: number};
  ledger: {id: string; orderId: string | null; delta: number; reason: string; createdAt: string; expiresAt: string | null}[];
}

/** How far ahead the points page warns about expiring points. */
const EXPIRY_WINDOW_DAYS = 30;

function numberField(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function ledgerRow(value: unknown): PointsResponse['ledger'][number] {
  if (!isRecord(value) || typeof value.id !== 'string' || !(typeof value.order_id === 'string' || value.order_id === null) ||
      typeof value.delta !== 'number' || typeof value.reason !== 'string' || typeof value.created_at !== 'string' ||
      !(typeof value.expires_at === 'string' || value.expires_at === null)) {
    throw new ServiceUnavailableException('Points service unavailable');
  }
  return {id: value.id, orderId: value.order_id, delta: value.delta, reason: value.reason, createdAt: value.created_at, expiresAt: value.expires_at};
}

@Injectable()
export class PointsService {
  constructor(private readonly repository: PointsRepository, private readonly logger: AppLogger) {}

  async get(user: RequestUser): Promise<PointsResponse> {
    try {
      const profile = await this.repository.findBalance(user.id);
      const ledger = await this.repository.listLedger(user.id);
      const [expiring, referral, spendable] = await Promise.all([
        this.repository.expiringSoon(user.id, EXPIRY_WINDOW_DAYS),
        this.repository.referral(user.id),
        this.repository.spendable(user.id)
      ]);
      if (profile === null || typeof profile.points_balance !== 'number' || typeof profile.purchases_count !== 'number') {
        throw new ServiceUnavailableException('Points service unavailable');
      }
      const purchaseCount = profile.purchases_count;
      return {
        balance: profile.points_balance,
        purchaseCount,
        level: levelForPurchases(purchaseCount),
        spendable,
        expiringSoon: {
          points: typeof expiring?.points === 'number' ? expiring.points : 0,
          firstExpiry: typeof expiring?.first_expiry === 'string' ? expiring.first_expiry : null,
          days: EXPIRY_WINDOW_DAYS
        },
        referral: {
          code: referral.code,
          invited: numberField(referral.summary?.invited),
          rewarded: numberField(referral.summary?.rewarded),
          rewardPoints: numberField(referral.summary?.reward_points)
        },
        ledger: ledger.map(ledgerRow)
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('points lookup failed');
      throw new ServiceUnavailableException('Points service unavailable');
    }
  }
}
