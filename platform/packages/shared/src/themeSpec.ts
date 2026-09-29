import {z} from 'zod';
import {LOCALES} from './localized';
import {assetUrl, cssColor, parseContract, sectionType} from './invitation';

const identifier = z.string().trim().min(1);
export const themeSpec = z.object({
  id: identifier,
  tokens: z.object({
    colors: z.record(identifier, cssColor),
    fonts: z.object({display: identifier, body: identifier}).strict(),
    radius: z.number().min(0), spacing: z.enum(['compact', 'normal', 'airy'])
  }).strict(),
  layout: z.object({
    intro: z.enum(['video-open', 'scratch-reveal', 'none']),
    sections: z.array(z.object({type: sectionType, variant: identifier.optional()}).strict())
  }).strict(),
  assets: z.record(identifier, z.union([assetUrl, z.string().regex(/^(?:r2|lib):\/\/[^\s\\]+$/u)])),
  motion: z.object({reveal: identifier, intro: identifier.optional(), durationScale: z.number().min(0.5).max(2)}).strict(),
  copy: z.object({locale: z.array(z.enum(LOCALES)).min(1).refine(values => new Set(values).size === values.length, 'Locales must be unique'), tone: identifier}).strict()
}).strict();
export type ThemeSpec = z.infer<typeof themeSpec>;
export function parseThemeSpec(input: unknown) { return parseContract(themeSpec, input); }
