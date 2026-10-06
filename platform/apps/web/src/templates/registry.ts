import {
  catalogEntry,
  isPubliclyListed,
  type CatalogEntry,
  type InvitationData,
} from '@platform/shared';
import {getAfricaData} from './africa/data';
import {fontClassName as africaFontClassName} from './africa/fonts';
import {getMashrabiyaData} from './mashrabiya/data';
import {fontClassName as mashrabiyaFontClassName} from './mashrabiya/fonts';
import {getCitystarsData} from './citystars/data';
import {fontClassName as citystarsFontClassName} from './citystars/fonts';
import {getExcellenceData} from './excellence/data';
import {fontClassName as excellenceFontClassName} from './excellence/fonts';
import {getEleganteData} from './elegante/data';
import {fontClassName as eleganteFontClassName} from './elegante/fonts';

export interface TemplateDefinition {
  entry: CatalogEntry;
  getData: () => InvitationData;
  fontClassName: string;
}

const mashrabiyaEntry: CatalogEntry = catalogEntry.parse({
  slug: 'mashrabiya',
  name: {ar: 'مشربية', en: 'Mashrabiya'},
  tagline: {
    ar: 'أمسية قاهرية ساحرة تحت ضوء القمر بشبابيك مشربية أصيلة',
    en: 'A Cairo rooftop evening under the moon with authentic mashrabiya shutters',
  },
  tier: 'classic',
  status: 'live',
  featured: true,
  assets: [
    {path: '/assets/demo/mashrabiya/lattice.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/mashrabiya/khatam-rule.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/mashrabiya/crescent.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/mashrabiya/ornament.svg', source: 'original', license: 'original, © Invitely'},
  ],
});


const africaEntry: CatalogEntry = catalogEntry.parse({
  slug: 'africa',
  name: {ar: 'رحلة سفاري', en: 'Africa Safari Wedding'},
  tagline: {
    ar: 'زفاف مستوحى من رحلات السفاري مع فيديو تمهيدي',
    en: 'Safari editorial wedding with video intro',
  },
  tier: 'classic',
  status: 'draft',
  featured: false,
  assets: [
    {path: '/assets/drafts/africa/intro-poster.jpg', source: 'legacy-scrape', license: ''},
  ],
});

export const templates: Record<string, TemplateDefinition> = {
  africa: {
    entry: africaEntry,
    getData: getAfricaData,
    fontClassName: africaFontClassName,
  },

  mashrabiya: {
    entry: mashrabiyaEntry,
    getData: getMashrabiyaData,
    fontClassName: mashrabiyaFontClassName,
  },

  citystars: {
    entry: catalogEntry.parse({
      slug: 'citystars',
      name: {ar: 'نجوم المدينة', en: 'Citystars Wedding'},
      tagline: {
        ar: 'زفاف كلاسيكي مع عد تنازلي',
        en: 'Classic wedding with countdown',
      },
      tier: 'classic',
      status: 'draft',
      featured: false,
      assets: [
        {path: '/assets/drafts/citystars/intro-poster.jpg', source: 'legacy-scrape', license: ''},
      ],
    }),
    getData: getCitystarsData,
    fontClassName: citystarsFontClassName,
  },

  excellence: {
    entry: catalogEntry.parse({
      slug: 'excellence',
      name: {ar: 'الامتياز', en: 'Excellence Wedding'},
      tagline: {
        ar: 'زفاف فاخر مع خطة لليومين',
        en: 'Luxury wedding with weekend itinerary',
      },
      tier: 'classic',
      status: 'draft',
      featured: false,
      assets: [
        {path: '/assets/drafts/excellence/intro-poster.jpg', source: 'legacy-scrape', license: ''},
      ],
    }),
    getData: getExcellenceData,
    fontClassName: excellenceFontClassName,
  },

  elegante: {
    entry: catalogEntry.parse({
      slug: 'elegante',
      name: {ar: 'الأناقة', en: 'Elegante Wedding'},
      tagline: {
        ar: 'زفاف ريفي مع معرض صور',
        en: 'Rustic wedding with photo gallery',
      },
      tier: 'classic',
      status: 'draft',
      featured: false,
      assets: [
        {path: '/assets/drafts/elegante/intro-poster.jpg', source: 'legacy-scrape', license: ''},
      ],
    }),
    getData: getEleganteData,
    fontClassName: eleganteFontClassName,
  },
};

export function listLiveTemplates(): TemplateDefinition[] {
  return Object.values(templates).filter((template) => isPubliclyListed(template.entry));
}

export function listDraftTemplates(): TemplateDefinition[] {
  return Object.values(templates).filter((template) => template.entry.status === 'draft');
}

export function getTemplate(slug: string): TemplateDefinition | undefined {
  const t = templates[slug];
  if (t && isPubliclyListed(t.entry)) return t;
  return undefined;
}

export function getTemplateAny(slug: string): TemplateDefinition | undefined {
  return templates[slug];
}
