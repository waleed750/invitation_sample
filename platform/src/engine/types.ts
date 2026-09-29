import type {Section, SectionType} from '@/lib/schemas/invitation';
export type SectionProps<T extends SectionType> = Extract<Section, {type: T}>['props'];
