import type {ExecutionContext} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import type {Request} from 'express';
import {RolesGuard} from '../auth/roles.guard';
import type {AuthRepository} from '../auth/auth.repository';
import {AdminPaymentEventsController, AssignEventBody, EventQueueQuery, PaymentEventsController} from './payment-events.controller';
import type {PaymentEventsService} from './payment-events.service';

describe('payment event controllers', () => {
  const receive = jest.fn().mockResolvedValue({ok: true});
  const service = {receive} as unknown as PaymentEventsService;
  it('forwards the exact raw body and headers', async () => {
    const rawBody = Buffer.from('{ "id": "x" }');
    const headers = {'x-signature': 'sig'};
    await new PaymentEventsController(service).webhook({provider: 'generic-hmac'}, {rawBody, headers} as unknown as Request & {rawBody: Buffer});
    expect(receive).toHaveBeenLastCalledWith('generic-hmac', rawBody, headers);
  });
  it('passes empty bytes when capture is absent (verification fails closed)', async () => {
    await new PaymentEventsController(service).webhook({provider: 'easyconfirm'}, {headers: {}} as Request);
    expect(receive).toHaveBeenLastCalledWith('easyconfirm', Buffer.alloc(0), {});
  });
  it('validates admin queue limits and required assignment note', () => {
    expect(EventQueueQuery.schema.parse({})).toEqual({status: 'unmatched', limit: 50});
    expect(() => EventQueueQuery.schema.parse({limit: 101})).toThrow();
    expect(() => EventQueueQuery.schema.parse({status: 'received'})).toThrow();
    expect(() => AssignEventBody.schema.parse({orderId: 'bad', note: ''})).toThrow();
  });
  it.each(['list', 'assign'] as const)('real RolesGuard denies non-admin for %s (no listening socket)', async (method) => {
    const repository = {findRoleByUserId: jest.fn().mockResolvedValue({data: {role: 'customer'}, error: null})};
    const guard = new RolesGuard(new Reflector(), repository as unknown as AuthRepository);
    const context = {
      getClass: () => AdminPaymentEventsController,
      // Reflector needs the original decorated function, without binding.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      getHandler: () => AdminPaymentEventsController.prototype[method],
      switchToHttp: () => ({getRequest: () => ({user: {id: 'customer', jwt: 'token'}})})
    } as unknown as ExecutionContext;
    await expect(guard.canActivate(context)).rejects.toMatchObject({status: 403});
  });
});
