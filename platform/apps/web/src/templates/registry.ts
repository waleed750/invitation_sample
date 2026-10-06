import {
  catalogEntry,
  isPubliclyListed,
  type CatalogEntry,
  type InvitationData,
} from '@platform/shared';
import {getAfricaData} from './africa/data';
import {fontClassName as africaFontClassName} from './africa/fonts';
import {getMashrabiyaData} from './mashrabiya/data';
import {fontClassName} from './mashrabiya/fonts';

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
    fontClassName,
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
