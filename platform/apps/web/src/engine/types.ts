import type {Section, SectionType} from '@platform/shared';
export type SectionProps<T extends SectionType> = Extract<Section, {type: T}>['props'];
