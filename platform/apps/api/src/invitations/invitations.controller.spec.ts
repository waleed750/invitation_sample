/* eslint-disable */
import {Test} from '@nestjs/testing';
import {InvitationsController} from './invitations.controller';
import {InvitationsService} from './invitations.service';

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let service: InvitationsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [InvitationsController],
      providers: [
        {
          provide: InvitationsService,
          useValue: {list: jest.fn().mockResolvedValue([])}
        }
      ]
    }).compile();

    controller = module.get(InvitationsController);
    service = module.get(InvitationsService);
  });

  it('should list invitations', async () => {
    const user = {id: '123', jwt: 'token'} as any;
    const result = await controller.list(user);
    expect(result).toEqual([]);
    expect(service.list).toHaveBeenCalledWith(user);
  });
});
