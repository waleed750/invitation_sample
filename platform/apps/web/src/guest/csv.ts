import type {Rsvp} from './store';

function safeSpreadsheetCell(value: string): string {
  return /^[=+\-@]/u.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number | boolean): string {
  const safe = safeSpreadsheetCell(String(value));
  return `"${safe.replaceAll('"', '""')}"`;
}

export function buildRsvpCsv(rsvps: Rsvp[]): string {
  const rows: Array<Array<string | number | boolean>> = [
    ['Name', 'Phone', 'Attending', 'Guests', 'Note', 'Created at'],
    ...rsvps.map((rsvp) => [rsvp.name, rsvp.phone ?? '', rsvp.attending ? 'Yes' : 'No', rsvp.guests, rsvp.note ?? '', rsvp.createdAt]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
