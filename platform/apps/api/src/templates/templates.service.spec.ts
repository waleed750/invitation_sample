import {ServiceUnavailableException} from '@nestjs/common';
import {Test} from '@nestjs/testing';
import {AppLogger} from '../common/app-logger';
import {TemplatesRepository} from './templates.repository';
import {TemplatesService} from './templates.service';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let repository: {listLive: jest.Mock};

  beforeEach(async () => {
    repository = {listLive: jest.fn().mockResolvedValue([])};

    const module = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {provide: TemplatesRepository, useValue: repository},
        {provide: AppLogger, useValue: {error: jest.fn()}}
      ]
    }).compile();

    service = module.get(TemplatesService);
  });

  it('should list live templates', async () => {
    repository.listLive.mockResolvedValue([{
      slug: 'test',
      name: {en: 'Test'},
      tagline: {en: 'Test tagline'},
      tier: 'classic',
      status: 'live',
      featured: true,
      prices: []
    }]);
    const result = await service.listLive();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('test');
  });

  const row = (prices: unknown[]) => ({
    slug: 'test', name: {en: 'Test'}, tagline: {en: 'T'}, tier: 'classic', status: 'live', featured: false, prices
  });

  it('maps the template-specific EGP price to priceOverrideEgp', async () => {
    repository.listLive.mockResolvedValue([row([
      {tier: 'classic', currency: 'USD', amount_minor: 9900},
      {tier: 'premium', currency: 'EGP', amount_minor: 300000},
      {tier: 'classic', currency: 'EGP', amount_minor: 149900}
    ])]);
    const result = await service.listLive();
    expect(result[0].priceOverrideEgp).toBe(1499);
  });

  it('omits priceOverrideEgp when there is no EGP row or it is not whole', async () => {
    repository.listLive.mockResolvedValue([row([]), row([{tier: 'classic', currency: 'EGP', amount_minor: 149950}])]);
    const result = await service.listLive();
    expect(result[0].priceOverrideEgp).toBeUndefined();
    expect(result[1].priceOverrideEgp).toBeUndefined();
  });

  it('should throw ServiceUnavailableException on DB error', async () => {
    repository.listLive.mockRejectedValue(new Error('DB Error'));
    await expect(service.listLive()).rejects.toThrow(ServiceUnavailableException);
  });
});
