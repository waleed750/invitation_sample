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
  ledger: {id: string; orderId: string | null; delta: number; reason: string; createdAt: string; expiresAt: string | null}[];
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
      const profileResult: unknown = await this.repository.findBalance(user.jwt, user.id);
      const ledgerResult: unknown = await this.repository.listLedger(user.jwt, user.id);
      if (!isRecord(profileResult) || profileResult.error !== null || !isRecord(profileResult.data) ||
          typeof profileResult.data.points_balance !== 'number' || typeof profileResult.data.purchases_count !== 'number' ||
          !isRecord(ledgerResult) || ledgerResult.error !== null || !Array.isArray(ledgerResult.data)) {
        throw new ServiceUnavailableException('Points service unavailable');
      }
      const purchaseCount = profileResult.data.purchases_count;
      return {
        balance: profileResult.data.points_balance,
        purchaseCount,
        level: levelForPurchases(purchaseCount),
        ledger: ledgerResult.data.map(ledgerRow)
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error('points lookup failed');
      throw new ServiceUnavailableException('Points service unavailable');
    }
  }
}
