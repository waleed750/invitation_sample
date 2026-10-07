import {describe, expect, it} from 'vitest';
import {buildRsvpCsv} from '../csv';

describe('buildRsvpCsv', () => {
  it('starts with a BOM and a header row', () => {
    const csv = buildRsvpCsv([]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('"Name","Phone","Attending","Guests","Note","Created at"');
  });

  it('neutralises formula-injection cells', () => {
    const csv = buildRsvpCsv([
      {name: '=cmd|calc', phone: '+201012345678', attending: true, guests: 2, note: '@evil', createdAt: '2026-01-01T00:00:00Z'},
      {name: '+123', phone: undefined, attending: false, guests: 0, note: '-x', createdAt: '2026-01-02T00:00:00Z'},
    ]);
    expect(csv).toContain("\"'=cmd|calc\"");
    expect(csv).toContain("\"'@evil\"");
    expect(csv).toContain("\"'+123\"");
    expect(csv).toContain("\"'-x\"");
  });

  it('escapes quotes and uses CRLF', () => {
    const csv = buildRsvpCsv([{name: 'Say "hi"', phone: '', attending: true, guests: 1, createdAt: '2026-01-01T00:00:00Z'}]);
    expect(csv).toContain('"Say ""hi"""');
    expect(csv.endsWith('\r\n')).toBe(true);
  });
});
