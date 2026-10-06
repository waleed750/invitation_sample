/* eslint-disable */
import {Test} from '@nestjs/testing';
import {DevPaymentsController} from './dev-payments.controller';
import {PaymentsService} from './payments.service';

describe('DevPaymentsController', () => {
  let controller: DevPaymentsController;
  let service: PaymentsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [DevPaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {simulate: jest.fn().mockResolvedValue({ok: true})}
        }
      ]
    }).compile();

    controller = module.get(DevPaymentsController);
    service = module.get(PaymentsService);
  });

  it('should simulate success', async () => {
    const result = await controller.succeed({id: 'u1', jwt: 'x'}, {orderId: '123'});
    expect(result).toEqual({ok: true});
    expect(service.simulate).toHaveBeenCalledWith('123', 'paid', 'u1');
  });

  it('should simulate fail', async () => {
    const result = await controller.fail({id: 'u1', jwt: 'x'}, {orderId: '123'});
    expect(result).toEqual({ok: true});
    expect(service.simulate).toHaveBeenCalledWith('123', 'failed', 'u1');
  });
});
