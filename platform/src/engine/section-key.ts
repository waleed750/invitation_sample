import type {Section} from '@/lib/schemas/invitation';
export function sectionKey(section: Pick<Section, 'id' | 'type'>, index: number): string {
  return section.id ?? `${section.type}-${index}`;
}
