import {AUTO_ID_PREFIX, DocumentError, MAX_SECTIONS_HARD_LIMIT, type DocumentSection, type InvitationDocument} from './schema';
import type {ThemePreset} from './presets';
import type {SectionType} from '../invitation';

/** Produces a fresh section id; injectable so tests and server code stay deterministic. */
export type IdFactory = () => string;

let counter = 0;
export const defaultIdFactory: IdFactory = () => {
  counter += 1;
  const random = typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${AUTO_ID_PREFIX}${random}${counter.toString(36)}`;
};

function indexOfSection(doc: InvitationDocument, id: string): number {
  const index = doc.sections.findIndex((item) => item.id === id);
  if (index === -1) throw new DocumentError('section_not_found', `No section with id "${id}"`);
  return index;
}

function assertUnlocked(item: DocumentSection): void {
  if (item.locked) throw new DocumentError('section_locked', `Section "${item.id}" is locked by the template`);
}

function withSections(doc: InvitationDocument, sections: DocumentSection[]): InvitationDocument {
  return {...doc, sections};
}

export interface NewSection {
  type: SectionType;
  props: Record<string, unknown>;
  variant?: string | null;
  id?: string;
  hidden?: boolean;
}

/** Inserts a section at `index` (default: the end). Ids stay unique: a clashing explicit id is replaced by a generated one. */
export function addSection(doc: InvitationDocument, input: NewSection, index: number = doc.sections.length, newId: IdFactory = defaultIdFactory): InvitationDocument {
  if (!Number.isInteger(index) || index < 0 || index > doc.sections.length) throw new DocumentError('index_out_of_range', `Index ${String(index)} is out of range`);
  if (doc.sections.length >= MAX_SECTIONS_HARD_LIMIT) throw new DocumentError('too_many_sections', `A document holds at most ${String(MAX_SECTIONS_HARD_LIMIT)} sections`);
  const taken = new Set(doc.sections.map((item) => item.id));
  let id = input.id ?? newId();
  while (taken.has(id)) id = newId();
  const created: DocumentSection = {id, type: input.type, variant: input.variant ?? null, hidden: input.hidden ?? false, locked: false, props: input.props};
  return withSections(doc, [...doc.sections.slice(0, index), created, ...doc.sections.slice(index)]);
}

export function removeSection(doc: InvitationDocument, id: string): InvitationDocument {
  const index = indexOfSection(doc, id);
  assertUnlocked(doc.sections[index] as DocumentSection);
  return withSections(doc, doc.sections.filter((_, position) => position !== index));
}

/** Moves a section so it ends up at `toIndex` (0-based, in the resulting order). Other sections keep their relative order. */
export function moveSection(doc: InvitationDocument, id: string, toIndex: number): InvitationDocument {
  const from = indexOfSection(doc, id);
  if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= doc.sections.length) throw new DocumentError('index_out_of_range', `Index ${String(toIndex)} is out of range`);
  const moving = doc.sections[from] as DocumentSection;
  assertUnlocked(moving);
  if (from === toIndex) return doc;
  const rest = doc.sections.filter((_, position) => position !== from);
  return withSections(doc, [...rest.slice(0, toIndex), moving, ...rest.slice(toIndex)]);
}

/** Copies a section directly after the original, with a new id and no lock. */
export function duplicateSection(doc: InvitationDocument, id: string, newId: IdFactory = defaultIdFactory): InvitationDocument {
  const index = indexOfSection(doc, id);
  const original = doc.sections[index] as DocumentSection;
  const copyOf: NewSection = {type: original.type, props: structuredClone(original.props), variant: original.variant, hidden: original.hidden};
  return addSection(doc, copyOf, index + 1, newId);
}

export function toggleHidden(doc: InvitationDocument, id: string): InvitationDocument {
  const index = indexOfSection(doc, id);
  const item = doc.sections[index] as DocumentSection;
  assertUnlocked(item);
  return withSections(doc, doc.sections.map((entry, position) => (position === index ? {...entry, hidden: !entry.hidden} : entry)));
}

export function setVariant(doc: InvitationDocument, id: string, variant: string | null): InvitationDocument {
  const index = indexOfSection(doc, id);
  assertUnlocked(doc.sections[index] as DocumentSection);
  return withSections(doc, doc.sections.map((entry, position) => (position === index ? {...entry, variant} : entry)));
}

export function applyThemePreset(doc: InvitationDocument, preset: Pick<ThemePreset, 'id' | 'colors' | 'fonts'>): InvitationDocument {
  return {...doc, theme: {presetId: preset.id, colors: {...preset.colors}, fonts: {...preset.fonts}}};
}
