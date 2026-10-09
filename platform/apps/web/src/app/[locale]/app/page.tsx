import {getTranslations, setRequestLocale} from 'next-intl/server';
import {levelForPurchases} from '@platform/shared';
import {getCommerceClient} from '@/commerce';
import {CopyButton} from '@/commerce/CopyButton';
import {DashboardMeters} from '@/commerce/DashboardMeters';
import {
  IconCalendar,
  IconChevron,
  IconExternalLink,
  IconSparkles,
  IconStar,
  IconWhatsApp,
} from '@/commerce/icons';
import {getPublicStore} from '@/guest';
import {shareUrl} from '@/commerce/share';
import {Link} from '@/i18n/navigation';
import {formatDate} from '@/lib/format';
import {getTemplate} from '@/templates/registry';

const DAY_MS = 86_400_000;

export default async function DashboardHome({
  params,
}: {
  params: Promise<{locale: 'ar' | 'en'}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const client = getCommerceClient();
  const store = getPublicStore();

  const [invitations, points] = await Promise.all([
    client.listInvitations(),
    client.getPoints(),
  ]);

  const t = await getTranslations('dashboard');
  const tPick = await getTranslations('pick');
  const now = new Date();
  const level = levelForPurchases(points.purchaseCount);

  // Fetch RSVPs for invitations to compute honest stats & contextual actions
  const invitationsWithRsvps = await Promise.all(
    invitations.map(async (invitation) => {
      const rsvps = await store.listRsvps(invitation.shareSlug).catch(() => []);
      return {invitation, rsvps};
    }),
  );

  const primaryInvitation = invitationsWithRsvps[0]?.invitation;
  const coupleGreeting = primaryInvitation
    ? `${primaryInvitation.couple.first} & ${primaryInvitation.couple.second}`
    : '';

  const daysToCelebration = primaryInvitation
    ? Math.max(0, Math.ceil((new Date(primaryInvitation.eventDate).getTime() - now.getTime()) / DAY_MS))
    : null;

  return (
    <div className="dashboard-home-content">
      {/* GREETING ROW WITH CHIPS (replaces old welcome slab) */}
      <section className="greeting-row" aria-label={t('home.greeting')}>
        <div className="greeting-header">
          <h1 className="greeting-title">
            {coupleGreeting
              ? t('home.greetingNames', {names: coupleGreeting})
              : t('home.greeting')}
          </h1>
          <div className="greeting-chips">
            {daysToCelebration !== null && (
              <span className="info-chip countdown-chip">
                <IconCalendar size={16} />
                <span>{t('home.chipsCountdown', {days: daysToCelebration})}</span>
              </span>
            )}
            <Link className="info-chip points-chip" href="/app/points">
              <IconSparkles size={16} />
              <span>{t('home.chipsPoints', {points: points.balance, level: t(`levels.${level}`)})}</span>
            </Link>
          </div>
          <Link className="btn-primary" href="/app/new">
            <span>{tPick('newInvitation')}</span>
            <IconChevron size={18} />
          </Link>
        </div>
      </section>

      {/* INVITATIONS SECTION */}
      {invitations.length === 0 ? (
        <section className="dashboard-empty-card" aria-label={t('home.emptyTitle')}>
          <div className="empty-arch-frame" aria-hidden="true">
            <IconStar size={36} />
          </div>
          <h2 className="empty-title">{t('home.emptyTitle')}</h2>
          <p className="empty-description">{t('home.emptyDescription')}</p>
          <Link className="btn-primary" href="/templates">
            <span>{t('home.emptyAction')}</span>
            <IconChevron size={18} />
          </Link>
        </section>
      ) : (
        <div className="invitations-stack">
          {invitationsWithRsvps.map(({invitation, rsvps}) => {
            const template = getTemplate(invitation.templateSlug);
            const templateName =
              (typeof template?.entry.name === 'string'
                ? template?.entry.name
                : template?.entry.name[locale as 'ar' | 'en'] ?? template?.entry.name.ar) ??
              invitation.templateSlug;

            const daysLeft = invitation.onlineUntil
              ? Math.max(0, Math.ceil((new Date(invitation.onlineUntil).getTime() - now.getTime()) / DAY_MS))
              : null;
            const editsLeft = Math.max(0, invitation.editsAllowed - invitation.editsUsed);

            const attendingGuests = rsvps
              .filter((rsvp) => rsvp.attending)
              .reduce((sum, rsvp) => sum + rsvp.guests, 0);
            const totalReplies = rsvps.length;

            const url = shareUrl(invitation, locale);
            const whatsappText = encodeURIComponent(
              `${t('share.message', {
                first: invitation.couple.first,
                second: invitation.couple.second,
              })} ${url}`,
            );

            // Contextual primary action
            let primaryAction: {label: string; href: string; external?: boolean};
            if (invitation.status === 'draft') {
              primaryAction = {
                label: t('home.actionReview'),
                href: `/app/invitations/${invitation.id}`,
              };
            } else if (daysLeft !== null && daysLeft <= 14) {
              primaryAction = {
                label: t('home.actionExtend'),
                href: `/checkout/${invitation.templateSlug}?tier=${invitation.tier}&kind=extension`,
              };
            } else if (totalReplies === 0) {
              primaryAction = {
                label: t('home.actionWhatsApp'),
                href: `https://wa.me/?text=${whatsappText}`,
                external: true,
              };
            } else {
              primaryAction = {
                label: t('home.actionReplies'),
                href: `/app/invitations/${invitation.id}/guests`,
              };
            }

            // Quiet upsells condition: only when edits <= 3 or days <= 30
            const showUpsells = editsLeft <= 3 || (daysLeft !== null && daysLeft <= 30);

            return (
              <article className="invitation-hero-card" key={invitation.id}>
                <div className="hero-card-main">
                  {/* Arched live thumbnail */}
                  <div className="hero-card-thumb" aria-hidden="true">
                    <div className="hero-card-arch">
                      <IconStar size={20} className="arch-star" />
                      <span className="arch-names">
                        {invitation.couple.first.slice(0, 1)} &amp; {invitation.couple.second.slice(0, 1)}
                      </span>
                    </div>
                  </div>

                  <div className="hero-card-details">
                    <div className="hero-card-top-row">
                      <span className="hero-card-template-name">{templateName}</span>
                      <span className={`status-badge status-badge--${invitation.status}`}>
                        {t(`statuses.${invitation.status}`)}
                      </span>
                    </div>

                    <h2 className="hero-card-couple">
                      {invitation.couple.first} <span>&amp;</span> {invitation.couple.second}
                    </h2>

                    <p className="hero-card-date">
                      {formatDate(invitation.eventDate, locale)}
                    </p>

                    {/* Contextual primary action */}
                    <div className="hero-card-actions">
                      {primaryAction.external ? (
                        <a
                          className="btn-primary"
                          href={primaryAction.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <IconWhatsApp size={18} />
                          <span>{primaryAction.label}</span>
                        </a>
                      ) : (
                        <Link className="btn-primary" href={primaryAction.href}>
                          <span>{primaryAction.label}</span>
                          <IconChevron size={18} />
                        </Link>
                      )}

                      <div className="hero-card-secondary-links">
                        <a
                          className="text-action-link"
                          href={`/i/${invitation.shareSlug}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <IconExternalLink size={15} />
                          <span>{t('home.preview')}</span>
                        </a>
                        <CopyButton
                          value={url}
                          label={t('home.copyLink')}
                          copiedLabel={t('home.copiedLink')}
                          className="btn-ghost-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* STATS ROW (4 tiles) */}
                <div className="hero-card-stats-grid">
                  <div className="stat-tile">
                    <span className="stat-tile-label">{t('home.statAttending')}</span>
                    <strong className="stat-tile-number">{attendingGuests}</strong>
                  </div>
                  <div className="stat-tile">
                    <span className="stat-tile-label">{t('home.statReplies')}</span>
                    <strong className="stat-tile-number">{totalReplies}</strong>
                  </div>
                  <div className="stat-tile">
                    <span className="stat-tile-label">{t('home.statEdits')}</span>
                    <strong className="stat-tile-number">
                      {editsLeft}/{invitation.editsAllowed}
                    </strong>
                  </div>
                  <div className="stat-tile">
                    <span className="stat-tile-label">{t('home.statDays')}</span>
                    <strong className="stat-tile-number">
                      {daysLeft === null ? '—' : `${daysLeft} ${t('home.daysOnline').slice(0, 3)}`}
                    </strong>
                  </div>
                </div>

                {/* Honest meters */}
                <DashboardMeters
                  invitation={invitation}
                  now={now}
                  labels={{
                    edits: t('home.edits'),
                    editsValue: t('home.editsValue', {
                      left: editsLeft,
                      allowed: invitation.editsAllowed,
                    }),
                    days: t('home.daysOnline'),
                    daysValue: t('home.daysValue', {days: daysLeft ?? 0}),
                    starts: t('home.startsOnPublish'),
                  }}
                />

                {/* Latest replies preview if any */}
                {rsvps.length > 0 && (
                  <div className="latest-replies-preview">
                    <div className="latest-replies-header">
                      <span className="latest-replies-title">{t('home.latestReplies')}</span>
                      <Link
                        href={`/app/invitations/${invitation.id}/guests`}
                        className="latest-replies-all-link"
                      >
                        <span>{t('home.allGuests')}</span>
                        <IconChevron size={14} />
                      </Link>
                    </div>
                    <ul className="latest-replies-list">
                      {rsvps.slice(0, 3).map((rsvp) => (
                        <li key={rsvp.id} className="latest-reply-row">
                          <span className="reply-avatar">{rsvp.name.slice(0, 1)}</span>
                          <span className="reply-name">{rsvp.name}</span>
                          <span
                            className={`reply-status-tag ${
                              rsvp.attending ? 'is-attending' : 'is-declined'
                            }`}
                          >
                            {rsvp.attending ? t('home.statAttending') : 'اعتذر'} · {rsvp.guests}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quiet upsells row: only when edits <= 3 or days <= 30 */}
                {showUpsells && (
                  <div className="quiet-upsells-row">
                    <span className="upsells-label">إضافات وتمديد:</span>
                    <div className="upsells-actions">
                      {editsLeft <= 3 && (
                        <Link
                          className="btn-secondary"
                          href={`/checkout/${invitation.templateSlug}?tier=${invitation.tier}&kind=edits`}
                        >
                          {t('home.upsellEdits')}
                        </Link>
                      )}
                      {daysLeft !== null && daysLeft <= 30 && (
                        <Link
                          className="btn-secondary"
                          href={`/checkout/${invitation.templateSlug}?tier=${invitation.tier}&kind=extension`}
                        >
                          {t('home.upsellExtend')}
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
