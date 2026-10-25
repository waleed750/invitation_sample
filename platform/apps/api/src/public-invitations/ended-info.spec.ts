import {extractEndedInfo} from './public-invitations.service';

describe('extractEndedInfo', () => {
  it('reads the legacy flat shape', () => {
    expect(extractEndedInfo({data: {couple: {first: 'Sara', second: 'Ali'}, eventDate: '2027-06-15'}})).toEqual({couple: {first: 'Sara', second: 'Ali'}, eventDate: '2027-06-15'});
  });
  it('reads localized names from the invitation data', () => {
    const info = extractEndedInfo({couple: {firstName: {ar: 'سارة', en: 'Sara'}, secondName: {ar: 'علي', en: 'Ali'}}, event: {date: {ar: '٢٠٢٧', en: '2027'}}});
    expect(info.couple.first).not.toBe('');
    expect(info.couple.second).not.toBe('');
  });
  it('reads an editor document (couple and event live under meta)', () => {
    const info = extractEndedInfo({data: {schemaVersion: 1, meta: {couple: {firstName: 'Sara', secondName: 'Ali'}, event: {date: '2027-06-15'}}, sections: []}});
    expect(info).toEqual({couple: {first: 'Sara', second: 'Ali'}, eventDate: '2027-06-15'});
  });
  it('never throws on junk', () => {
    for (const junk of [null, 5, 'x', [], {}, {data: 5}]) expect(extractEndedInfo(junk).couple).toEqual({first: '', second: ''});
  });
});
