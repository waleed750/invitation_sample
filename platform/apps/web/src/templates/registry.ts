import {
  catalogEntry,
  isPubliclyListed,
  type CatalogEntry,
  type InvitationData,
} from '@platform/shared';
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

export const templates: Record<string, TemplateDefinition> = {
  mashrabiya: {
    entry: mashrabiyaEntry,
    getData: getMashrabiyaData,
    fontClassName,
  },
};

export function listLiveTemplates(): TemplateDefinition[] {
  return Object.values(templates).filter((template) => isPubliclyListed(template.entry));
}

export function getTemplate(slug: string): TemplateDefinition | undefined {
  return templates[slug];
}
