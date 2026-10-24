import {section, type SectionType} from '@platform/shared';

/**
 * What the inspector shows for a section: fields derived from the section's own Zod schema, so a new
 * section type or prop appears in the editor without hand-written forms.
 */
export type Field =
  | {kind: 'text'; key: string; optional: boolean}
  | {kind: 'string'; key: string; optional: boolean; format: 'plain' | 'url' | 'datetime' | 'color'; media: MediaKind | null}
  | {kind: 'boolean'; key: string; optional: boolean}
  | {kind: 'number'; key: string; optional: boolean}
  | {kind: 'enum'; key: string; optional: boolean; options: string[]}
  | {kind: 'list'; key: string; optional: boolean; item: ListItem}
  | {kind: 'group'; key: string; optional: boolean; fields: Field[]};

export type MediaKind = 'image' | 'video' | 'audio';
export type ListItem = {kind: 'text'} | {kind: 'string'; media: MediaKind | null} | {kind: 'group'; fields: Field[]};

interface ZodNode {
  def: {type: string; innerType?: ZodNode; options?: ZodNode[]; element?: ZodNode; entries?: Record<string, string>; format?: string};
  shape?: Record<string, ZodNode>;
}

const MEDIA_KEY = /(video)/i;
const AUDIO_KEY = /(music|audio|song)/i;
const IMAGE_KEY = /(url|image|photo|poster|bg|badge|ornament|frame|illustration|monogram|logo|sunset|divider|stamp|starfish|birds|columns?|overlay|lights)/i;

function mediaKindFor(key: string): MediaKind | null {
  if (MEDIA_KEY.test(key)) return 'video';
  if (AUDIO_KEY.test(key)) return 'audio';
  if (/(url|image|photo|poster|bg|badge|ornament|frame|illustration|monogram|logo|sunset|divider|stamp|starfish|birds|column|overlay|lights|src)$/i.test(key) && !/(mapUrl|portfolioUrl|buttonUrl|websiteUrl)$/.test(key)) return 'image';
  return IMAGE_KEY.test(key) && /Url$/.test(key) && !/(mapUrl|portfolioUrl|buttonUrl|websiteUrl)$/.test(key) ? 'image' : null;
}

function isLocalizedText(node: ZodNode): boolean {
  if (node.def.type !== 'union' || node.def.options === undefined) return false;
  const kinds = node.def.options.map((option) => option.def.type);
  return kinds.length === 2 && kinds.includes('string') && kinds.includes('object');
}

function unwrap(node: ZodNode): {node: ZodNode; optional: boolean} {
  let current = node;
  let optional = false;
  while (current.def.type === 'optional' || current.def.type === 'nullable' || current.def.type === 'default') {
    optional = true;
    if (current.def.innerType === undefined) break;
    current = current.def.innerType;
  }
  return {node: current, optional};
}

function fieldFor(key: string, raw: ZodNode): Field | null {
  const {node, optional} = unwrap(raw);
  if (isLocalizedText(node)) return {kind: 'text', key, optional};
  switch (node.def.type) {
    case 'string': {
      const format = node.def.format === 'datetime' ? 'datetime' : /color/i.test(key) ? 'color' : /(url|src)$/i.test(key) ? 'url' : 'plain';
      return {kind: 'string', key, optional, format, media: mediaKindFor(key)};
    }
    case 'boolean': return {kind: 'boolean', key, optional};
    case 'number': return {kind: 'number', key, optional};
    case 'enum': return {kind: 'enum', key, optional, options: Object.values(node.def.entries ?? {})};
    case 'union': {
      // assetUrl-style unions (https url | same-origin path) are plain strings for the editor
      const kinds = (node.def.options ?? []).map((option) => option.def.type);
      if (kinds.every((kind) => kind === 'string')) return {kind: 'string', key, optional, format: 'url', media: mediaKindFor(key)};
      return null;
    }
    case 'object': {
      const fields = fieldsOf(node);
      return fields.length === 0 ? null : {kind: 'group', key, optional, fields};
    }
    case 'array': {
      const element = node.def.element;
      if (element === undefined) return null;
      const item = itemFor(element, key);
      return item === null ? null : {kind: 'list', key, optional, item};
    }
    default:
      return null;
  }
}

function itemFor(raw: ZodNode, key: string): ListItem | null {
  const {node} = unwrap(raw);
  if (isLocalizedText(node)) return {kind: 'text'};
  if (node.def.type === 'string') return {kind: 'string', media: mediaKindFor(key)};
  if (node.def.type === 'union') {
    const kinds = (node.def.options ?? []).map((option) => option.def.type);
    if (kinds.every((kind) => kind === 'string' || kind === 'union')) return {kind: 'string', media: mediaKindFor(key)};
    // gallery images: a url, or {src, alt}; edited as plain urls
    return {kind: 'string', media: mediaKindFor(key)};
  }
  if (node.def.type === 'object') {
    const fields = fieldsOf(node);
    return fields.length === 0 ? null : {kind: 'group', fields};
  }
  return null;
}

function fieldsOf(objectNode: ZodNode): Field[] {
  const shape = objectNode.shape ?? {};
  return Object.entries(shape).flatMap(([key, child]) => {
    const field = fieldFor(key, child);
    return field === null ? [] : [field];
  });
}

const cache = new Map<SectionType, Field[]>();

/** The editable fields of one section type, in schema order. */
export function fieldsFor(type: SectionType): Field[] {
  const cached = cache.get(type);
  if (cached) return cached;
  const option = (section as unknown as {options: {shape: {type: {value: string}; props: ZodNode}}[]}).options.find((candidate) => candidate.shape.type.value === type);
  const fields = option ? fieldsOf(option.shape.props) : [];
  cache.set(type, fields);
  return fields;
}

/** An empty value for a field (used by "add item" and when an optional field is first filled in). */
export function emptyFor(field: Field | ListItem): unknown {
  switch (field.kind) {
    case 'text': return {ar: '', en: ''};
    case 'string': return '';
    case 'boolean': return false;
    case 'number': return 0;
    case 'enum': return field.options[0] ?? '';
    case 'group': return Object.fromEntries(field.fields.filter((child) => !child.optional).map((child) => [child.key, emptyFor(child)]));
    case 'list': return [];
  }
}

export function getAt(props: Record<string, unknown>, key: string): unknown {
  return props[key];
}

/** Returns new props with `key` set; `undefined` removes an optional key (so empty optional fields vanish from the document). */
export function setAt(props: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
  const next = {...props};
  if (value === undefined) delete next[key];
  else next[key] = value;
  return next;
}
