import type {Section} from '@platform/shared';
export function sectionKey(section: Pick<Section, 'id' | 'type'>, index: number): string {
  return section.id ?? `${section.type}-${index}`;
}
