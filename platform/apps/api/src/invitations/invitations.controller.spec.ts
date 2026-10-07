/* eslint-disable */
import {Test} from '@nestjs/testing';
import {InvitationsController, SlugsController} from './invitations.controller';
import {InvitationsService} from './invitations.service';
import {InvitationEditingService} from './invitation-editing.service';

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let service: InvitationsService;
  let slugs: SlugsController;
  let editing: any;
  const user = {id: '123', jwt: 'token'} as any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [InvitationsController, SlugsController],
      providers: [
        {
          provide: InvitationsService,
          useValue: {list: jest.fn().mockResolvedValue([])}
        },
        {
          provide: InvitationEditingService,
          useValue: {
            get: jest.fn().mockResolvedValue({id: 'i1'}),
            updateData: jest.fn().mockResolvedValue({updatedAt: 'u2'}),
            updateSlug: jest.fn().mockResolvedValue({slug: 'new-slug'}),
            publish: jest.fn().mockResolvedValue({ok: false, reason: 'no_edits_left'}),
            availability: jest.fn().mockResolvedValue({available: true, suggestions: []})
          }
        }
      ]
    }).compile();

    controller = module.get(InvitationsController);
    service = module.get(InvitationsService);
    slugs = module.get(SlugsController);
    editing = module.get(InvitationEditingService);
  });

  it('should list invitations', async () => {
    const user = {id: '123', jwt: 'token'} as any;
    const result = await controller.list(user);
    expect(result).toEqual([]);
    expect(service.list).toHaveBeenCalledWith(user);
  });

  it('gets one invitation', async () => {
    expect(await controller.get({id: 'i1'} as any, user)).toEqual({id: 'i1'});
    expect(editing.get).toHaveBeenCalledWith(user, 'i1');
  });

  it('passes If-Match through on update', async () => {
    const body = {data: {}} as any;
    expect(await controller.update({id: 'i1'} as any, body, user, 'u1')).toEqual({updatedAt: 'u2'});
    expect(editing.updateData).toHaveBeenCalledWith(user, 'i1', body, 'u1');
  });

  it('updates the slug', async () => {
    expect(await controller.updateSlug({id: 'i1'} as any, {slug: 'new-slug'} as any, user)).toEqual({slug: 'new-slug'});
    expect(editing.updateSlug).toHaveBeenCalledWith(user, 'i1', 'new-slug');
  });

  it('publishes', async () => {
    expect(await controller.publish({id: 'i1'} as any, user)).toEqual({ok: false, reason: 'no_edits_left'});
    expect(editing.publish).toHaveBeenCalledWith(user, 'i1');
  });

  it('checks slug availability', async () => {
    expect(await slugs.availability({slug: 'abc'} as any)).toEqual({available: true, suggestions: []});
    expect(editing.availability).toHaveBeenCalledWith('abc');
  });
});
