/** Minimal RSVP shape the CSV exporter needs (API + web both map to this). */
export interface RsvpCsvRow {
  name: string;
  phone?: string;
  attending: boolean;
  guests: number;
  note?: string;
  createdAt: string;
}

/** Formula-injection defence: prefix cells starting with `= + - @` with `'`. */
function safeSpreadsheetCell(value: string): string {
  return /^[=+\-@]/u.test(value) ? `'${value}` : value;
}

function csvCell(value: string | number | boolean): string {
  const safe = safeSpreadsheetCell(String(value));
  return `"${safe.replaceAll('"', '""')}"`;
}

/** UTF-8 BOM + CRLF + quoted cells. Never changes shape without a test. */
export function buildRsvpCsv(rsvps: RsvpCsvRow[]): string {
  const rows: Array<Array<string | number | boolean>> = [
    ['Name', 'Phone', 'Attending', 'Guests', 'Note', 'Created at'],
    ...rsvps.map((rsvp) => [rsvp.name, rsvp.phone ?? '', rsvp.attending ? 'Yes' : 'No', rsvp.guests, rsvp.note ?? '', rsvp.createdAt]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}
