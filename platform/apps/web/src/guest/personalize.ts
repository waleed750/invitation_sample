import {TIERS, parseInvitationData, toInvitationData, type InvitationData, type InvitationDocument, type Tier} from '@platform/shared';
import {formatDate, type FormatLocale} from '../lib/format';
import type {PublishedSnapshot} from './store';

function eventTimestamp(value: string): string {
  const timestamp = /^\d{4}-\d{2}-\d{2}$/u.test(value) ? `${value}T19:30:00+02:00` : value;
  if (!Number.isFinite(new Date(timestamp).getTime())) throw new RangeError('Invalid snapshot event date');
  return timestamp;
}

export function applyPersonalization(data: InvitationData, snapshot: PublishedSnapshot, locale: FormatLocale): InvitationData {
  const date = eventTimestamp(snapshot.eventDate);
  const displayDate = formatDate(date, locale);
  const allowed = TIERS[snapshot.tier];
  const sections = data.sections
    .filter((section) => allowed.rsvpLimit !== 0 || section.type !== 'rsvp')
    .filter((section) => allowed.guestMessages || section.type !== 'messageForm')
    .map((section) => {
      if (section.type === 'hero') return {...section, props: {...section.props, firstName: snapshot.couple.first, secondName: snapshot.couple.second, displayDate}};
      if (section.type === 'countdown') return {...section, props: {...section.props, date}};
      return section;
    });
  const personalized = {
    ...structuredClone(data),
    couple: {...data.couple, firstName: snapshot.couple.first, secondName: snapshot.couple.second},
    event: {...data.event, date, displayDate},
    sections,
  };
  const parsed = parseInvitationData(personalized);
  if (!parsed.ok) throw new Error(`Invalid personalized invitation: ${JSON.stringify(parsed.errors)}`);
  return parsed.data;
}

/**
 * What the public page renders for a site the customer edited: the published document, flattened, minus hidden
 * sections (done by `toInvitationData`) and minus anything the plan does not include.
 */
export function renderDocument(document: InvitationDocument, tier: Tier): InvitationData {
  const data = toInvitationData(document);
  const allowed = TIERS[tier];
  const sections = data.sections
    .filter((section) => allowed.rsvpLimit !== 0 || section.type !== 'rsvp')
    .filter((section) => allowed.guestMessages || section.type !== 'messageForm');
  const parsed = parseInvitationData({...data, sections});
  if (!parsed.ok) throw new Error(`Invalid published invitation: ${JSON.stringify(parsed.errors)}`);
  return parsed.data;
}
