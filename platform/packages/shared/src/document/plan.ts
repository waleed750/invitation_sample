import {TIERS, type Tier} from '../entitlement';
import {sectionType, type SectionType} from '../invitation';
import type {DocumentSection, InvitationDocument} from './schema';

export interface PlanRules {
  maxSections: number;
  allowedSectionTypes: ReadonlySet<SectionType>;
}

const ALL_TYPES: readonly SectionType[] = sectionType.options;

function typesFor(tier: Tier): ReadonlySet<SectionType> {
  const allowed = new Set<SectionType>(ALL_TYPES);
  // RSVP collection and the guestbook are paid features (see TIERS).
  if (TIERS[tier].rsvpLimit === 0) allowed.delete('rsvp');
  if (!TIERS[tier].guestMessages) allowed.delete('messageForm');
  return allowed;
}

const MAX_SECTIONS: Record<Tier, number> = {'save-the-date': 10, classic: 20, premium: 40};

/** What a plan may contain: allowed section types and the section cap. */
export function planRules(tier: Tier): PlanRules {
  return {maxSections: MAX_SECTIONS[tier], allowedSectionTypes: typesFor(tier)};
}

export type PlanViolation =
  | {code: 'section_not_allowed'; sectionId: string; type: SectionType}
  | {code: 'too_many_sections'; max: number; count: number};

/** Lists everything in `doc` that the plan does not allow. Empty means fine. */
export function checkDocumentAgainstPlan(doc: InvitationDocument, tier: Tier): PlanViolation[] {
  const rules = planRules(tier);
  const violations: PlanViolation[] = [];
  if (doc.sections.length > rules.maxSections) violations.push({code: 'too_many_sections', max: rules.maxSections, count: doc.sections.length});
  for (const item of doc.sections) {
    if (!rules.allowedSectionTypes.has(item.type)) violations.push({code: 'section_not_allowed', sectionId: item.id, type: item.type});
  }
  return violations;
}

export type LockViolation = {code: 'section_locked'; sectionId: string};

function sameSection(a: DocumentSection, b: DocumentSection): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Sections the template locked must survive an edit unchanged and in the same relative order.
 * (Unlocked sections may move around them.)
 */
export function checkLockedSections(previous: InvitationDocument, next: InvitationDocument): LockViolation[] {
  const violations: LockViolation[] = [];
  const lockedBefore = previous.sections.filter((item) => item.locked);
  const nextById = new Map(next.sections.map((item) => [item.id, item]));
  for (const locked of lockedBefore) {
    const current = nextById.get(locked.id);
    if (current === undefined || !sameSection(locked, current)) violations.push({code: 'section_locked', sectionId: locked.id});
  }
  const lockedOrderBefore = lockedBefore.map((item) => item.id);
  const lockedOrderAfter = next.sections.filter((item) => lockedOrderBefore.includes(item.id)).map((item) => item.id);
  if (lockedOrderAfter.length === lockedOrderBefore.length && lockedOrderAfter.some((id, index) => id !== lockedOrderBefore[index])) {
    for (const id of lockedOrderBefore) if (!violations.some((v) => v.sectionId === id)) violations.push({code: 'section_locked', sectionId: id});
  }
  return violations;
}
