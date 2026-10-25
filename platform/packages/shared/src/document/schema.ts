import {z} from 'zod';
import {LOCALES} from '../localized';
import {copy, couple, cssColor, event, media, section, sectionType, templateMeta} from '../invitation';

/** Bump when the stored document shape changes; `migrate()` upgrades older shapes. */
export const DOCUMENT_SCHEMA_VERSION = 1 as const;

/** Generated ids start with this prefix; they are dropped again by `toInvitationData` so legacy data round-trips exactly. */
export const AUTO_ID_PREFIX = 'auto-';

export const MAX_SECTIONS_HARD_LIMIT = 60;

export const sectionId = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/, 'Section ids are 1-64 letters, digits, "_" or "-"');

export const documentTheme = z
  .object({
    presetId: z.string().min(1).max(40).nullable(),
    colors: z.object({background: cssColor, foreground: cssColor, muted: cssColor, ivory: cssColor}).strict(),
    fonts: z.record(z.string().min(1).max(40), z.string().min(1).max(80))
  })
  .strict();

export const documentLocales = z
  .object({primary: z.enum(LOCALES), enabled: z.array(z.enum(LOCALES)).min(1).max(LOCALES.length)})
  .strict()
  .refine((value) => value.enabled.includes(value.primary), {message: 'The primary locale must be enabled', path: ['enabled']})
  .refine((value) => new Set(value.enabled).size === value.enabled.length, {message: 'Locales must be unique', path: ['enabled']});

export const documentSection = z
  .object({
    id: sectionId,
    type: sectionType,
    variant: z.string().min(1).max(40).nullable(),
    hidden: z.boolean(),
    locked: z.boolean(),
    props: z.record(z.string(), z.unknown())
  })
  .strict()
  .superRefine((value, context) => {
    // Reuse the strict per-type props schema of the legacy contract.
    const result = section.safeParse({type: value.type, props: value.props});
    if (!result.success) {
      for (const issue of result.error.issues) {
        context.addIssue({code: 'custom', message: issue.message, path: ['props', ...issue.path.filter((part) => part !== 'props')]});
      }
    }
  });

/** Content that is not a section; carried so the document is a lossless superset of the legacy `InvitationData`. */
export const documentMeta = z
  .object({
    template: templateMeta,
    couple,
    event,
    media,
    copy,
    schedule: z.array(z.unknown()).optional()
  })
  .strict();

export const invitationDocument = z
  .object({
    schemaVersion: z.literal(DOCUMENT_SCHEMA_VERSION),
    theme: documentTheme,
    locales: documentLocales,
    meta: documentMeta,
    sections: z.array(documentSection).max(MAX_SECTIONS_HARD_LIMIT)
  })
  .strict()
  .superRefine((value, context) => {
    const seen = new Set<string>();
    value.sections.forEach((item, index) => {
      if (seen.has(item.id)) context.addIssue({code: 'custom', message: `Duplicate section id "${item.id}"`, path: ['sections', index, 'id']});
      seen.add(item.id);
    });
  });

export type DocumentTheme = z.infer<typeof documentTheme>;
export type DocumentLocales = z.infer<typeof documentLocales>;
export type DocumentSection = z.infer<typeof documentSection>;
export type DocumentMeta = z.infer<typeof documentMeta>;
export type InvitationDocument = z.infer<typeof invitationDocument>;

export class DocumentError extends Error {
  constructor(
    readonly code:
      | 'unrecognized_document'
      | 'section_not_found'
      | 'section_locked'
      | 'index_out_of_range'
      | 'too_many_sections'
      | 'invalid_section',
    message: string
  ) {
    super(message);
    this.name = 'DocumentError';
  }
}
