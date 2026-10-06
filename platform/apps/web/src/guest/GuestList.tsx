'use client';

import {useMemo, useState} from 'react';
import type {Rsvp} from './store';

interface Labels {
  search: string;
  empty: string;
  name: string;
  phone: string;
  response: string;
  guests: string;
  note: string;
  date: string;
  attending: string;
  declined: string;
  whatsapp: string;
  whatsappMessage: string;
}

export function GuestList({rsvps, labels, locale}: {rsvps: Rsvp[]; labels: Labels; locale: 'ar' | 'en'}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale);
    if (!normalized) return rsvps;
    return rsvps.filter((rsvp) => `${rsvp.name} ${rsvp.phone ?? ''}`.toLocaleLowerCase(locale).includes(normalized));
  }, [locale, query, rsvps]);
  return <>
    <label className="guest-search"><span>{labels.search}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    {filtered.length === 0 ? <p className="guests-empty">{labels.empty}</p> : <div className="guest-table-wrap"><table className="guest-table"><thead><tr><th>{labels.name}</th><th>{labels.phone}</th><th>{labels.response}</th><th>{labels.guests}</th><th>{labels.note}</th><th>{labels.date}</th></tr></thead><tbody>{filtered.map((rsvp) => {
      const digits = rsvp.phone?.replace(/\D/gu, '');
      const whatsapp = digits ? `https://wa.me/${digits}?text=${encodeURIComponent(labels.whatsappMessage)}` : undefined;
      return <tr key={rsvp.id}><td data-label={labels.name}><strong>{rsvp.name}</strong></td><td data-label={labels.phone}>{whatsapp ? <a className="guest-phone" dir="ltr" href={whatsapp} target="_blank" rel="noreferrer">{rsvp.phone}<span className="sr-only"> — {labels.whatsapp}</span></a> : '—'}</td><td data-label={labels.response}><span className={`guest-response ${rsvp.attending ? 'attending' : 'declined'}`}>{rsvp.attending ? labels.attending : labels.declined}</span></td><td data-label={labels.guests}>{rsvp.guests}</td><td data-label={labels.note}>{rsvp.note || '—'}</td><td data-label={labels.date}><time dateTime={rsvp.createdAt}>{new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {dateStyle: 'medium'}).format(new Date(rsvp.createdAt))}</time></td></tr>;
    })}</tbody></table></div>}
  </>;
}
