import '@/styles/admin-more.css';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {EditLinkIssuer} from '@/admin/more/EditLinkIssuer';
import {RevokeLinkButton} from '@/admin/more/RevokeLinkButton';
import {adminGet} from '@/admin/more/call';
import {formatDate} from '@/lib/format';

export const dynamic = 'force-dynamic';

interface LinkRow {id: string; label: string | null; created_at: string; expires_at: string; revoked_at: string | null; last_used_at: string | null; claimed_at: string | null}

export default async function AdminInvitationPage({params}: {params: Promise<{locale: 'ar' | 'en'; id: string}>}) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('adminMore.editLinks');
  const links = await adminGet<LinkRow[]>(`/v1/admin/invitations/${encodeURIComponent(id)}/edit-links`);
  const state = (link: LinkRow): 'claimed' | 'revoked' | 'expired' | 'active' =>
    link.claimed_at ? 'claimed' : link.revoked_at ? 'revoked' : new Date(link.expires_at).getTime() <= Date.now() ? 'expired' : 'active';

  return (
    <div className="am-page" data-testid="admin-invitation-links">
      <h1>{t('title')}</h1>
      <p>{t('help')}</p>
      <section className="am-card"><EditLinkIssuer invitationId={id} /></section>
      <section className="am-card">
        <h2>{t('existing')}</h2>
        {links.length === 0 && <p>{t('none')}</p>}
        {links.map((link) => {
          const status = state(link);
          return (
            <div key={link.id} className="am-inline" data-testid="link-row" data-status={status}>
              <strong>{link.label ?? '—'}</strong>
              <span className={`am-badge ${status === 'active' ? 'am-badge--live' : 'am-badge--retired'}`}>{t(`states.${status}`)}</span>
              <small>{t('created', {date: formatDate(link.created_at, locale)})} · {t('expires', {date: formatDate(link.expires_at, locale)})}{link.last_used_at ? ` · ${t('lastUsed', {date: formatDate(link.last_used_at, locale)})}` : ''}</small>
              {status === 'active' && <RevokeLinkButton linkId={link.id} />}
            </div>
          );
        })}
      </section>
    </div>
  );
}
