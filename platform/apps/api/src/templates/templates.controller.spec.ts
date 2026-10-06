/* eslint-disable */
import {Test} from '@nestjs/testing';
import {TemplatesController} from './templates.controller';
import {TemplatesService} from './templates.service';

describe('TemplatesController', () => {
  let controller: TemplatesController;
  let service: TemplatesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [
        {
          provide: TemplatesService,
          useValue: {listLive: jest.fn().mockResolvedValue([])}
        }
      ]
    }).compile();

    controller = module.get(TemplatesController);
    service = module.get(TemplatesService);
  });

  it('should list live templates', async () => {
    const result = await controller.list();
    expect(result).toEqual([]);
    expect(service.listLive).toHaveBeenCalled();
  });
});
