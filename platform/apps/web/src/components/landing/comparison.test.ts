import { describe, it, expect } from 'vitest';
import { comparisonRows } from './comparison';
import { TIERS, TIER_ORDER } from '@platform/shared';

describe('comparisonRows', () => {
  it('generates rows for each tier dynamically from TIERS', () => {
    const rows = comparisonRows();
    
    expect(rows).toHaveLength(7);
    
    // Check that we have values for all tier orders
    for (const row of rows) {
      for (const tier of TIER_ORDER) {
        expect(row.values).toHaveProperty(tier);
      }
    }
    
    const editsRow = rows.find(r => r.key === 'publishedEdits')!;
    expect(editsRow.values['save-the-date']).toBe(TIERS['save-the-date'].editsAllowed);
    expect(editsRow.values.premium).toBe(TIERS.premium.editsAllowed);

    const onlineRow = rows.find(r => r.key === 'monthsOnline')!;
    expect(onlineRow.values.classic).toBe(TIERS.classic.onlineMonths);
  });
  
  it('does not hardcode any price number', () => {
    const stringified = comparisonRows.toString();
    // No hardcoded tier values like 1299 or 499
    expect(stringified).not.toMatch(/1299/);
    expect(stringified).not.toMatch(/499/);
    expect(stringified).not.toMatch(/2499/);
  });
});
