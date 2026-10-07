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
        prices: []
      }],
      error: null
    });
    const result = await service.listLive();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('test');
  });

  const row = (prices: unknown[]) => ({
    slug: 'test', name: {en: 'Test'}, tagline: {en: 'T'}, tier: 'classic', status: 'live', featured: false, prices
  });

  it('maps the template-specific EGP price to priceOverrideEgp', async () => {
    supabaseClient.order.mockResolvedValue({
      data: [row([
        {tier: 'classic', currency: 'USD', amount_minor: 9900},
        {tier: 'premium', currency: 'EGP', amount_minor: 300000},
        {tier: 'classic', currency: 'EGP', amount_minor: 149900}
      ])],
      error: null
    });
    const result = await service.listLive();
    expect(result[0].priceOverrideEgp).toBe(1499);
  });

  it('omits priceOverrideEgp when there is no EGP row or it is not whole', async () => {
    supabaseClient.order.mockResolvedValue({
      data: [row([]), row([{tier: 'classic', currency: 'EGP', amount_minor: 149950}])],
      error: null
    });
    const result = await service.listLive();
    expect(result[0].priceOverrideEgp).toBeUndefined();
    expect(result[1].priceOverrideEgp).toBeUndefined();
  });

  it('should throw ServiceUnavailableException on DB error', async () => {
    supabaseClient.order.mockResolvedValue({data: null, error: new Error('DB Error')});
    await expect(service.listLive()).rejects.toThrow(ServiceUnavailableException);
  });
});
