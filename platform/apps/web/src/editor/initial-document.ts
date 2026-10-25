import {migrate, planRules, type InvitationDocument, type InvitationData, type Tier} from '@platform/shared';
import {applyDetails, readDetails} from './couple';

/**
 * What the editor opens with. A document that already has sections is used as is. Otherwise (a brand-new order,
 * where checkout stored only the couple and the date) the editor starts from the template's own design with the
 * customer's names and date applied, so there is something to edit straight away.
 */
/** A template-seeded document may only hold what the plan allows (e.g. no RSVP form on Save the Date). */
function withinPlan(doc: InvitationDocument, tier: Tier): InvitationDocument {
  const rules = planRules(tier);
  const sections = doc.sections.filter((item) => rules.allowedSectionTypes.has(item.type)).slice(0, rules.maxSections);
  return sections.length === doc.sections.length ? doc : {...doc, sections};
}

export function startingDocument(stored: InvitationDocument | null, templateData: InvitationData | null, tier: Tier): InvitationDocument | null {
  if (stored !== null && stored.sections.length > 0) return stored;
  if (templateData === null) return stored;
  const base = migrate(JSON.parse(JSON.stringify(templateData)) as unknown);
  if (stored === null) return withinPlan(base, tier);
  const details = readDetails(stored, 'ar');
  const en = readDetails(stored, 'en');
  let doc = base;
  if (details.first || details.second) doc = applyDetails(doc, {first: details.first || en.first, second: details.second || en.second}, 'ar');
  if (en.first && en.first !== details.first) doc = applyDetails(doc, {first: en.first}, 'en');
  if (en.second && en.second !== details.second) doc = applyDetails(doc, {second: en.second}, 'en');
  if (details.date) doc = applyDetails(doc, {date: details.date}, 'ar');
  return withinPlan({...doc, locales: stored.locales}, tier);
}
