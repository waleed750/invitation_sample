/* eslint-disable */
import {Test} from '@nestjs/testing';
import {AdminCustomersController} from './admin-customers.controller';
import {AdminCustomersService} from './admin-customers.service';

describe('AdminCustomersController', () => {
  let controller: AdminCustomersController;
  let service: any;
  const user = {id: 'admin-1', jwt: 't'} as any;

  beforeEach(async () => {
    service = {
      search: jest.fn().mockResolvedValue([]),
      detail: jest.fn().mockResolvedValue({}),
      adjustEntitlement: jest.fn().mockResolvedValue({ok: true}),
      adjustPoints: jest.fn().mockResolvedValue({balance: 1})
    };
    const module = await Test.createTestingModule({
      controllers: [AdminCustomersController],
      providers: [{provide: AdminCustomersService, useValue: service}]
    }).compile();
    controller = module.get(AdminCustomersController);
  });

  it('searches with q and limit', async () => {
    await controller.search({q: 'mona', limit: 5} as any);
    expect(service.search).toHaveBeenCalledWith('mona', 5);
    await controller.search({limit: 20} as any);
    expect(service.search).toHaveBeenLastCalledWith('', 20);
  });

  it('loads a customer detail', async () => {
    await controller.detail({id: 'u1'});
    expect(service.detail).toHaveBeenCalledWith('u1');
  });

  it('passes the authenticated user id to both adjustments', async () => {
    const entitlement = {addEdits: 1, reason: 'goodwill'} as any;
    await controller.adjustEntitlement(user, {id: 'i1'}, entitlement);
    expect(service.adjustEntitlement).toHaveBeenCalledWith('admin-1', 'i1', entitlement);
    const points = {delta: 5, reason: 'goodwill'} as any;
    await controller.adjustPoints(user, {id: 'u1'}, points);
    expect(service.adjustPoints).toHaveBeenCalledWith('admin-1', 'u1', points);
  });
});
