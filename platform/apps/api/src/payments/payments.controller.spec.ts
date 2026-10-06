/* eslint-disable */
import {Test} from '@nestjs/testing';
import {PaymentsController} from './payments.controller';
import {PaymentsService} from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {handleWebhook: jest.fn().mockResolvedValue({ok: true})}
        }
      ]
    }).compile();

    controller = module.get(PaymentsController);
    service = module.get(PaymentsService);
  });

  it('should handle webhook with rawBody', async () => {
    const request = {rawBody: Buffer.from('test'), headers: {'x-test': '1'}} as any;
    const result = await controller.webhook({provider: 'mock'}, request);
    expect(result).toEqual({ok: true});
    expect(service.handleWebhook).toHaveBeenCalledWith('mock', Buffer.from('test'), {'x-test': '1'});
  });

  it('should handle webhook without rawBody', async () => {
    const request = {headers: {}} as any;
    const result = await controller.webhook({provider: 'mock'}, request);
    expect(result).toEqual({ok: true});
    expect(service.handleWebhook).toHaveBeenCalledWith('mock', expect.any(Buffer), {});
  });
});
