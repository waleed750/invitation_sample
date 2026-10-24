import {parseInvitationData, type InvitationData} from '../invitation';
import {AUTO_ID_PREFIX, DOCUMENT_SCHEMA_VERSION, DocumentError, invitationDocument, type DocumentSection, type InvitationDocument} from './schema';
import {THEME_PRESETS} from './presets';

const DEFAULT_THEME = THEME_PRESETS[0]!.colors;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown): string | {ar?: string; en?: string} | undefined {
  if (typeof value === 'string' && value !== '') return value;
  if (isRecord(value) && (typeof value.ar === 'string' || typeof value.en === 'string')) {
    const out: {ar?: string; en?: string} = {};
    if (typeof value.ar === 'string') out.ar = value.ar;
    if (typeof value.en === 'string') out.en = value.en;
    return out;
  }
  return undefined;
}

/** Whole-document form of the legacy `InvitationData` (lossless: see `toInvitationData`). */
function fromInvitationData(data: InvitationData): InvitationDocument {
  const sections: DocumentSection[] = data.sections.map((item, index) => ({
    id: item.id ?? `${AUTO_ID_PREFIX}${item.type}-${String(index + 1)}`,
    type: item.type,
    variant: null,
    hidden: false,
    locked: false,
    props: item.props as Record<string, unknown>
  }));
  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    theme: {presetId: null, colors: data.theme, fonts: {}},
    locales: {primary: 'ar', enabled: ['ar', 'en']},
    meta: {
      template: data.template,
      couple: data.couple,
      event: data.event,
      media: data.media,
      copy: data.copy,
      ...(data.schedule === undefined ? {} : {schedule: data.schedule})
    },
    sections
  };
}

/**
 * What checkout stores today: only the couple and the date (`{event_date, eventDate, couple:{first, second}}`).
 * Everything else gets neutral defaults so the editor has a complete document to start from.
 */
function fromCheckoutStub(raw: Record<string, unknown>): InvitationDocument {
  const couple = isRecord(raw.couple) ? raw.couple : {};
  const first = text(couple.firstName ?? couple.first) ?? '';
  const second = text(couple.secondName ?? couple.second) ?? '';
  const date = text(raw.eventDate ?? raw.event_date) ?? '';
  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    theme: {presetId: THEME_PRESETS[0]!.id, colors: {...DEFAULT_THEME}, fonts: {...THEME_PRESETS[0]!.fonts}},
    locales: {primary: 'ar', enabled: ['ar', 'en']},
    meta: {
      template: {eventType: 'wedding', siteType: 'full-invitation', experienceType: 'scroll-only', introType: 'none', layoutFamily: 'classic'},
      couple: {firstName: first === '' ? {ar: ''} : first, secondName: second === '' ? {ar: ''} : second},
      event: {date: date === '' ? {ar: ''} : date},
      media: {},
      copy: {}
    },
    sections: []
  };
}

/**
 * Brings anything stored in `invitations.data` to the latest document shape. Accepts:
 *  - a current document (returned unchanged),
 *  - a full legacy `InvitationData`,
 *  - the small object checkout stores for a new order.
 * Throws `DocumentError('unrecognized_document')` for anything else.
 */
export function migrate(input: unknown): InvitationDocument {
  if (!isRecord(input)) throw new DocumentError('unrecognized_document', 'Expected an object');
  if (input.schemaVersion === DOCUMENT_SCHEMA_VERSION) {
    const parsed = invitationDocument.safeParse(input);
    if (!parsed.success) throw new DocumentError('unrecognized_document', parsed.error.issues[0]?.message ?? 'Invalid document');
    return parsed.data;
  }
  const legacy = parseInvitationData(input);
  if (legacy.ok) return fromInvitationData(legacy.data);
  const looksLikeStub = 'couple' in input && !('template' in input);
  if (looksLikeStub || 'eventDate' in input || 'event_date' in input) return fromCheckoutStub(input);
  throw new DocumentError('unrecognized_document', 'Unknown invitation data shape');
}

/**
 * The legacy flat form the public renderer understands. Hidden sections are left out (that is what
 * "hidden" means); generated ids are dropped so migrated legacy data round-trips exactly.
 */
export function toInvitationData(doc: InvitationDocument): InvitationData {
  const visible = doc.sections.filter((item) => !item.hidden);
  return {
    template: doc.meta.template,
    theme: doc.theme.colors,
    couple: doc.meta.couple,
    event: doc.meta.event,
    media: doc.meta.media,
    copy: doc.meta.copy,
    sections: visible.map((item) => ({
      type: item.type,
      ...(item.id.startsWith(AUTO_ID_PREFIX) ? {} : {id: item.id}),
      props: item.props
    })) as InvitationData['sections'],
    ...(doc.meta.schedule === undefined ? {} : {schedule: doc.meta.schedule as NonNullable<InvitationData['schedule']>})
  };
}
