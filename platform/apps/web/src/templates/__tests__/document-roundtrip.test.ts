import {vi} from 'vitest';
vi.mock('next/font/local', () => ({
  default: (opts: {variable?: string}) => ({variable: opts.variable || '--mock-font'}),
}));
import {describe, expect, it} from 'vitest';
import {invitationDocument, migrate, parseInvitationData, toInvitationData} from '@platform/shared';
import {listDraftTemplates, listLiveTemplates} from '../registry';

// T10: every template's sample data must upgrade to the document model and come back unchanged.
const all = [...listLiveTemplates(), ...listDraftTemplates()];

describe('invitation document round trip for every template', () => {
  it('covers every template in the registry', () => {
    expect(all.length).toBeGreaterThanOrEqual(9);
  });

  for (const template of all) {
    const slug = template.entry.slug;
    it(`${slug}: sample data migrates losslessly`, () => {
      const data = JSON.parse(JSON.stringify(template.getData())) as unknown;
      const strict = parseInvitationData(data);
      expect(strict.ok, `${slug} sample data satisfies the invitation contract`).toBe(true);
      const doc = migrate(data);
      expect(invitationDocument.safeParse(doc).success, `${slug} document is valid`).toBe(true);
      expect(toInvitationData(doc)).toEqual(data);
      // and migrating the document again changes nothing
      expect(migrate(doc)).toEqual(doc);
    });
  }
});
