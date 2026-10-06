/* eslint-disable */
import {Test} from '@nestjs/testing';
import {CheckoutController} from './checkout.controller';
import {CheckoutService} from './checkout.service';

describe('CheckoutController', () => {
  let controller: CheckoutController;
  let service: CheckoutService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [
        {
          provide: CheckoutService,
          useValue: {start: jest.fn().mockResolvedValue({orderId: '1', redirectUrl: 'url'})}
        }
      ]
    }).compile();

    controller = module.get(CheckoutController);
    service = module.get(CheckoutService);
  });

  it('should start checkout', async () => {
    const user = {id: '1', jwt: 't1'} as any;
    const body = {templateSlug: 't1', tier: 'classic'} as any;
    const result = await controller.start(user, body, 'idemp-key');
    expect(result).toEqual({orderId: '1', redirectUrl: 'url'});
    expect(service.start).toHaveBeenCalledWith(user, body, 'idemp-key');
  });
});
