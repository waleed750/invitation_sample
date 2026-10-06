/* eslint-disable */
import {Test} from '@nestjs/testing';
import {OrdersController} from './orders.controller';
import {OrdersService} from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {list: jest.fn().mockResolvedValue([]), get: jest.fn().mockResolvedValue({id: '1'})}
        }
      ]
    }).compile();

    controller = module.get(OrdersController);
    service = module.get(OrdersService);
  });

  it('should list orders', async () => {
    const user = {id: 'u1', jwt: 't1'} as any;
    const result = await controller.list(user);
    expect(result).toEqual([]);
    expect(service.list).toHaveBeenCalledWith(user);
  });

  it('should get order', async () => {
    const user = {id: 'u1', jwt: 't1'} as any;
    const result = await controller.get(user, {id: '123'});
    expect(result).toEqual({id: '1'});
    expect(service.get).toHaveBeenCalledWith(user, '123');
  });
});
