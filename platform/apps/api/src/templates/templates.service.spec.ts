/* eslint-disable */
import {ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {SupabaseService} from '../supabase/supabase.service';
import {TemplatesRepository} from './templates.repository';
import {TemplatesService} from './templates.service';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let supabaseClient: any;

  beforeEach(async () => {
    supabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({data: [], error: null})
    };

    const module = await Test.createTestingModule({
      providers: [
        TemplatesService,
        TemplatesRepository, {provide: SupabaseService, useValue: {public: () => supabaseClient}},
        {provide: AppLogger, useValue: {error: jest.fn()}}
      ]
    }).compile();

    service = module.get(TemplatesService);
  });

  it('should list live templates', async () => {
    supabaseClient.order.mockResolvedValue({
      data: [{
        slug: 'test',
        name: {en: 'Test'},
        tagline: {en: 'Test tagline'},
        tier: 'classic',
        status: 'live',
        featured: true,
        price_override_egp: null
      }],
      error: null
    });
    const result = await service.listLive();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('test');
  });

  it('should throw ServiceUnavailableException on DB error', async () => {
    supabaseClient.order.mockResolvedValue({data: null, error: new Error('DB Error')});
    await expect(service.listLive()).rejects.toThrow(ServiceUnavailableException);
  });
});
