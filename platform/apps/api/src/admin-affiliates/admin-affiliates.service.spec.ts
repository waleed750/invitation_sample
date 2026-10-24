import {AdminAffiliatesService, csvCell} from './admin-affiliates.service';

describe('csvCell', () => {
  it('neutralises spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe(`"'=HYPERLINK(""http://evil"")"`);
    expect(csvCell('+1+1')).toBe("'+1+1");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
  });
  it('quotes commas, quotes and newlines; keeps Arabic as is', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('سارة')).toBe('سارة');
    expect(csvCell(null)).toBe('');
    expect(csvCell(true)).toBe('true');
  });
});

describe('AdminAffiliatesService.exportCsv', () => {
  it('writes a BOM, a header and one line per order with amounts in pounds', async () => {
    const repository = {orders: jest.fn().mockResolvedValue([
      {order_id: 'abcdef12-0000-4000-8000-000000000000', paid_at: '2026-10-01T10:00:00Z', amount_minor: 129900, attribution: 'code', commission_minor: 12990, payable: true, self_referral: false}
    ])};
    const csv = await new AdminAffiliatesService(repository as never).exportCsv('id', {});
    expect(csv.startsWith('﻿order,paid_at,amount_egp,attribution,commission_egp,payable,self_referral\r\n')).toBe(true);
    expect(csv).toContain('ABCDEF12,2026-10-01T10:00:00Z,1299.00,code,129.90,true,false');
  });
});
