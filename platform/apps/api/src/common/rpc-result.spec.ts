import {ConflictException, ForbiddenException, NotFoundException, ServiceUnavailableException, UnprocessableEntityException, BadRequestException} from '@nestjs/common';
import {unwrapRpc} from './rpc-result';

describe('unwrapRpc', () => {
  it('returns the result when ok', () => {
    expect(unwrapRpc({ok: true, id: 'x'})).toEqual({ok: true, id: 'x'});
  });
  it.each([
    ['not_admin', ForbiddenException], ['not_found', NotFoundException], ['code_taken', ConflictException],
    ['license_incomplete', UnprocessableEntityException], ['invalid_percent', BadRequestException]
  ])('maps %s to the right HTTP error', (reason, type) => {
    expect(() => unwrapRpc({ok: false, reason})).toThrow(type);
  });
  it('carries the machine code and extras', () => {
    try {
      unwrapRpc({ok: false, reason: 'license_incomplete', assets: ['a1']});
      fail('should throw');
    } catch (error) {
      expect((error as UnprocessableEntityException).getResponse()).toMatchObject({code: 'license_incomplete', assets: ['a1']});
    }
  });
  it('503 when the call itself failed', () => {
    expect(() => unwrapRpc(null)).toThrow(ServiceUnavailableException);
  });
});
