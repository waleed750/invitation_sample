/* eslint-disable */
import {NotFoundException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {GuestsRepository} from './guests.repository';
import {GuestsService} from './guests.service';

const USER = {id: 'owner-1'};
const RSVP_ROWS = [
  {id: 'r1', name: '=cmd|calc', phone: '+201012345678', attending: true, guests_count: 2, note: null, created_at: '2026-01-01T00:00:00Z'}
];
const MESSAGE_ROWS = [{id: 'm1', name: 'Sara', body: 'Congrats!', created_at: '2026-01-02T00:00:00Z'}];

describe('GuestsService', () => {
  let service: GuestsService;
  let repository: Record<string, jest.Mock>;

  beforeEach(async () => {
    repository = {
      findInvitationForUser: jest.fn().mockResolvedValue({id: 'inv-1'}),
      listRsvpsForUser: jest.fn().mockResolvedValue(RSVP_ROWS),
      listMessagesForUser: jest.fn().mockResolvedValue(MESSAGE_ROWS)
    };
    const module = await Test.createTestingModule({
      providers: [GuestsService, {provide: GuestsRepository, useValue: repository}, {provide: AppLogger, useValue: {error: jest.fn()}}]
    }).compile();
    service = module.get(GuestsService);
  });

  it('lists the owner RSVPs with phones', async () => {
    const result = await service.listRsvps(USER as any, 'inv-1');
    expect(result).toEqual([{id: 'r1', name: '=cmd|calc', phone: '+201012345678', attending: true, guests: 2, note: null, createdAt: '2026-01-01T00:00:00Z'}]);
  });

  it('lists the owner messages', async () => {
    const result = await service.listMessages(USER as any, 'inv-1');
    expect(result).toEqual([{id: 'm1', name: 'Sara', text: 'Congrats!', createdAt: '2026-01-02T00:00:00Z'}]);
  });

  it('returns 404 for someone else\'s invitation', async () => {
    repository.findInvitationForUser.mockResolvedValueOnce(null);
    await expect(service.listRsvps(USER as any, 'inv-1')).rejects.toThrow(NotFoundException);
    expect(repository.listRsvpsForUser).not.toHaveBeenCalled();
  });

  it('exports CSV with BOM and formula-injection defence', async () => {
    const csv = await service.exportRsvpsCsv(USER as any, 'inv-1');
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain("\"'=cmd|calc\"");
    expect(csv).toContain('+201012345678');
  });
});
