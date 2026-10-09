import {resolveText, type InvitationData, type Locale} from '@platform/shared';
import {formatDate} from '../lib/format';
import type {PickDetails} from './params';

function swapDate(original: string, isoDate: string): string {
  return /^\d{4}-\d{2}-\d{2}T/u.test(original) ? `${isoDate}${original.slice(10)}` : `${isoDate}T19:00:00+03:00`;
}

/**
 * Returns a copy of a template's sample data with the customer's names and
 * date injected into every field the engine renders them from.
 */
export function personalizeData(data: InvitationData, details: PickDetails, locale: Locale): InvitationData {
  const copy = structuredClone(data);
  const pretty = details.date ? formatDate(`${details.date}T12:00:00Z`, locale) : '';
  const names = [details.first, details.second].filter(Boolean).join(' & ');
  if (details.first) copy.couple.firstName = details.first;
  if (details.second) copy.couple.secondName = details.second;
  if (details.date) {
    copy.event.date = swapDate(resolveText(copy.event.date, locale), details.date);
    if (copy.event.displayDate !== undefined) copy.event.displayDate = pretty;
  }
  for (const section of copy.sections) {
    switch (section.type) {
      case 'hero':
        if (details.first) section.props.firstName = details.first;
        if (details.second) section.props.secondName = details.second;
        if (pretty) section.props.displayDate = pretty;
        break;
      case 'countdown':
        if (details.date) section.props.date = swapDate(section.props.date, details.date);
        break;
      case 'scratchReveal':
        if (details.first) section.props.firstName = details.first;
        if (details.second) section.props.secondName = details.second;
        if (pretty) section.props.date = pretty;
        break;
      case 'bohoFooter':
        if (names) section.props.names = names;
        break;
      case 'credit':
        if (names) section.props.coupleNames = names;
        if (pretty) section.props.eventDate = pretty;
        break;
      case 'details':
        if (pretty) section.props.dateLine = pretty;
        break;
      default:
        break;
    }
  }
  return copy;
}
