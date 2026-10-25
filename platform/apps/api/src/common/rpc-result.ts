import {
  BadRequestException, ConflictException, ForbiddenException, NotFoundException, ServiceUnavailableException,
  UnprocessableEntityException, type HttpException
} from '@nestjs/common';
import type {RpcObject} from './db-rows';

/** How a SQL function's `{ok:false, reason}` answer becomes an HTTP error. Unlisted reasons are 400s. */
const REASON_STATUS: Record<string, 'forbidden' | 'notFound' | 'conflict' | 'unprocessable'> = {
  not_admin: 'forbidden',
  not_found: 'notFound',
  asset_not_found: 'notFound',
  code_taken: 'conflict',
  slug_taken: 'conflict',
  invalid_transition: 'conflict',
  license_incomplete: 'unprocessable',
  exceeds_payable: 'unprocessable',
  not_refundable: 'conflict'
};

function failure(reason: string, extra: Record<string, unknown>): HttpException {
  const body = {code: reason, message: reason.replaceAll('_', ' '), ...extra};
  switch (REASON_STATUS[reason]) {
    case 'forbidden': return new ForbiddenException(body);
    case 'notFound': return new NotFoundException(body);
    case 'conflict': return new ConflictException(body);
    case 'unprocessable': return new UnprocessableEntityException(body);
    default: return new BadRequestException(body);
  }
}

/** Returns the result when `ok`, throws the matching HTTP error otherwise (503 when the call itself failed). */
export function unwrapRpc(result: RpcObject | null): RpcObject {
  if (result === null) throw new ServiceUnavailableException('Service unavailable');
  if (result.ok === true) return result;
  const extra = Object.fromEntries(Object.entries(result).filter(([key]) => key !== 'ok' && key !== 'reason'));
  throw failure(typeof result.reason === 'string' ? result.reason : 'failed', extra);
}
