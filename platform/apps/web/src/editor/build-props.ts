import {fromDbTier, invitationDocument, planRules, TIERS, type InvitationDocument, type SectionType} from '@platform/shared';
import {getTemplateAny} from '@/templates/registry';
import type {EditorProps} from './Editor';
import {startingDocument} from './initial-document';

/** `GET /v1/invitations/:id` as the editor pages read it. */
export interface InvitationDetail {
  id: string;
  slug: string;
  status: string;
  templateSlug: string | null;
  document: unknown;
  tier: string | null;
  updatedAt: string;
  publishedAt: string | null;
  entitlement: {remaining: number; onlineUntil: string | null; canPublish: {ok: boolean; reason?: string}};
}

/** What the editor needs from an invitation, or `null` when the template or document cannot be shown. */
export function editorPropsFor(detail: InvitationDetail, locale: 'ar' | 'en'): EditorProps | null {
  const template = detail.templateSlug === null ? null : getTemplateAny(detail.templateSlug);
  if (!template || detail.templateSlug === null) return null;
  const stored = invitationDocument.safeParse(detail.document);
  const tier = fromDbTier(detail.tier ?? 'save_the_date');
  const document: InvitationDocument | null = startingDocument(stored.success ? stored.data : null, template.getData(), tier);
  if (document === null) return null;
  const rules = planRules(tier);
  const plan = TIERS[tier];
  const verdict = detail.entitlement.canPublish;
  return {
    invitationId: detail.id,
    templateSlug: detail.templateSlug,
    locale,
    initialDocument: document,
    version: detail.updatedAt,
    allowedTypes: [...rules.allowedSectionTypes] as SectionType[],
    maxSections: rules.maxSections,
    remaining: detail.entitlement.remaining,
    expired: !verdict.ok && verdict.reason === 'expired',
    published: detail.publishedAt !== null,
    slug: detail.slug,
    canMusic: plan.musicUpload,
    canVideo: plan.videoIntro
  };
}
