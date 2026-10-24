import type {InvitationDocument, LocalizedText} from '@platform/shared';
import {formatDate} from '../lib/format';

type Locale = 'ar' | 'en';

/** Sets one language of a text and keeps the other (a new text gets the same value in both until translated). */
export function setLocalized(current: LocalizedText | undefined, locale: Locale, value: string): LocalizedText {
  if (current === undefined) return {ar: value, en: value};
  if (typeof current === 'string') return {ar: locale === 'ar' ? value : current, en: locale === 'en' ? value : current};
  return {ar: current.ar ?? value, en: current.en ?? value, [locale]: value};
}

export function readLocalized(value: LocalizedText | undefined, locale: Locale): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  return value[locale] ?? value[locale === 'ar' ? 'en' : 'ar'] ?? '';
}

export interface CoupleDetails {
  first?: string;
  second?: string;
  /** `YYYY-MM-DD` */
  date?: string;
}

/** `YYYY-MM-DD` -> an offset datetime at 19:30 Cairo time (the same default the public page uses). */
export function eventTimestamp(date: string): string {
  return `${date}T19:30:00+02:00`;
}

function displayDate(date: string): LocalizedText {
  const moment = new Date(eventTimestamp(date));
  if (Number.isNaN(moment.getTime())) return {ar: date, en: date};
  return {ar: formatDate(moment, 'ar'), en: formatDate(moment, 'en')};
}

/**
 * Updates the couple's names and the event date everywhere they appear: the document header and every
 * section that repeats them (cover, countdown). Used by easy mode and by the details panel.
 */
export function applyDetails(doc: InvitationDocument, details: CoupleDetails, locale: Locale): InvitationDocument {
  const meta = structuredClone(doc.meta);
  if (details.first !== undefined) meta.couple.firstName = setLocalized(meta.couple.firstName, locale, details.first);
  if (details.second !== undefined) meta.couple.secondName = setLocalized(meta.couple.secondName, locale, details.second);
  let shown: LocalizedText | undefined;
  if (details.date !== undefined && details.date !== '') {
    shown = displayDate(details.date);
    meta.event.date = {ar: details.date, en: details.date};
    meta.event.displayDate = shown;
  }
  const sections = doc.sections.map((item) => {
    if (item.type === 'hero') {
      const props = {...item.props};
      if (details.first !== undefined) props.firstName = setLocalized(props.firstName as LocalizedText | undefined, locale, details.first);
      if (details.second !== undefined) props.secondName = setLocalized(props.secondName as LocalizedText | undefined, locale, details.second);
      if (shown !== undefined) props.displayDate = shown;
      return {...item, props};
    }
    if (item.type === 'countdown' && details.date !== undefined && details.date !== '') {
      return {...item, props: {...item.props, date: eventTimestamp(details.date)}};
    }
    return item;
  });
  return {...doc, meta, sections};
}

/** The couple and date as the details form shows them. */
export function readDetails(doc: InvitationDocument, locale: Locale): Required<CoupleDetails> {
  const date = readLocalized(doc.meta.event.date, 'en');
  return {
    first: readLocalized(doc.meta.couple.firstName, locale),
    second: readLocalized(doc.meta.couple.secondName, locale),
    date: /^\d{4}-\d{2}-\d{2}/.test(date) ? date.slice(0, 10) : ''
  };
}
