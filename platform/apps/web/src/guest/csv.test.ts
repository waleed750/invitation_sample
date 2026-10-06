import {describe, expect, it} from 'vitest';
import {buildRsvpCsv} from './csv';

describe('buildRsvpCsv', () => {
  it('adds a UTF-8 BOM, escapes CSV values, and blocks spreadsheet formulas', () => {
    const csv = buildRsvpCsv([{
      id: '1', name: '=HYPERLINK("bad")', phone: '+201012345678', attending: true,
      guests: 2, note: 'Line, "quoted"', createdAt: '2026-10-07T12:00:00.000Z',
    }]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"\'+201012345678"');
    expect(csv).toContain('"Line, ""quoted"""');
    expect(csv).toContain('\r\n');
  });
});
