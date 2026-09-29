import {z} from 'zod';

export const LOCALES = ['ar', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const localizedText = z.union([
  z.string(),
  z.object({ar: z.string().optional(), en: z.string().optional()}).strict()
    .refine(value => value.ar !== undefined || value.en !== undefined, 'At least one translation is required')
]);
export type LocalizedText = z.infer<typeof localizedText>;

export function resolveText(value: LocalizedText, locale: Locale, fallbackLocale: Locale = 'ar'): string {
  if (typeof value === 'string') return value;
  return value[locale] ?? value[fallbackLocale] ?? value[locale === 'ar' ? 'en' : 'ar'] ?? '';
}
