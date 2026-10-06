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
import {getDiwanData} from './diwan/data';
import {fontClassName as diwanFontClassName} from './diwan/fonts';
import {getRawdaData} from './rawda/data';
import {fontClassName as rawdaFontClassName} from './rawda/fonts';

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
  featured: false,
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

const diwanEntry: CatalogEntry = catalogEntry.parse({
  slug: 'diwan',
  name: {ar: 'ديوان', en: 'Diwan'},
  tagline: {
    ar: 'أمسية أنيقة بخطوط الأمل والذهب',
    en: 'An elegant evening in green and gold',
  },
  tier: 'classic',
  status: 'live',
  featured: true,
  assets: [
    {path: '/assets/demo/diwan/star.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/diwan/lattice-tile.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/diwan/divider-star.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/diwan/arch-frame.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/diwan/event-ceremony.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/diwan/event-reception.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/diwan/corner-ornament.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/diwan/footer-ornament.svg', source: 'original', license: 'original, © Invitely'},
  ],
});

const rawdaEntry: CatalogEntry = catalogEntry.parse({
  slug: 'rawda',
  name: {ar: 'روضة', en: 'Rawda'},
  tagline: {
    ar: 'حديقة ورد أبيض وشموع تحت قوس من الحجر',
    en: 'A garden of white roses and candlelight beneath a stone arch',
  },
  tier: 'classic',
  status: 'draft',
  featured: false,
  assets: [
    {path: '/assets/demo/rawda/hero-arch.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/rawda/column.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/rawda/curtain-pleat.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/rawda/curtain-valance.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/rawda/urn-roses.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/rawda/event-ceremony.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/rawda/divider.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/rawda/monogram-ring.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/rawda/roses-corner-tl.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/rawda/footer-sprig.svg', source: 'original', license: 'original, © Invitely'},
    {path: '/assets/demo/rawda/paper-grain.svg', source: 'original', license: 'original, © Invitely'},
  ],
});

export const templates: Record<string, TemplateDefinition> = {
  diwan: {
    entry: diwanEntry,
    getData: getDiwanData,
    fontClassName: diwanFontClassName,
  },

  rawda: {
    entry: rawdaEntry,
    getData: getRawdaData,
    fontClassName: rawdaFontClassName,
  },

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
