/* eslint-disable */
import {Test} from '@nestjs/testing';
import {PointsController} from './points.controller';
import {PointsService} from './points.service';

describe('PointsController', () => {
  let controller: PointsController;
  let service: PointsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PointsController],
      providers: [
        {
          provide: PointsService,
          useValue: {get: jest.fn().mockResolvedValue({balance: 100})}
        }
      ]
    }).compile();

    controller = module.get(PointsController);
    service = module.get(PointsService);
  });

  it('should get points', async () => {
    const user = {id: '123', jwt: 'token'} as any;
    const result = await controller.get(user);
    expect(result).toEqual({balance: 100});
    expect(service.get).toHaveBeenCalledWith(user);
  });
});
