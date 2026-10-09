import QRCode from 'qrcode';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {canPublish, computeOnlineUntil} from '@platform/shared';
import {Bidi} from '@/components/Bidi';
import {getCommerceClient} from '@/commerce';
import {getPublicStore} from '@/guest';
import {CopyButton} from '@/commerce/CopyButton';
import {DashboardMeters} from '@/commerce/DashboardMeters';
import {
  IconCheck,
  IconChevron,
  IconExternalLink,
  IconUsers,
  IconWhatsApp,
} from '@/commerce/icons';
import {publishInvitationAction} from '@/commerce/dashboard-actions';
import {shareUrl} from '@/commerce/share';
import {formatDate} from '@/lib/format';
import {Link} from '@/i18n/navigation';
import {getTemplate} from '@/templates/registry';

export default async function InvitationPage({
  params,
}: {
  params: Promise<{locale: 'ar' | 'en'; id: string}>;
}) {
  const {locale, id} = await params;
  setRequestLocale(locale);

  const invitation = await getCommerceClient().getInvitation(id);
  if (!invitation) notFound();

  const rsvps = await getPublicStore().listRsvps(invitation.shareSlug);
  const t = await getTranslations('dashboard');
  const now = new Date();

  const template = getTemplate(invitation.templateSlug);
  const templateName =
    (typeof template?.entry.name === 'string'
      ? template?.entry.name
      : template?.entry.name[locale as 'ar' | 'en'] ?? template?.entry.name.ar) ??
    invitation.templateSlug;

  const onlineUntil =
    invitation.onlineUntil ??
    computeOnlineUntil({
      tier: invitation.tier,
      firstPublishedAt: now,
      eventDate: new Date(invitation.eventDate),
    }).toISOString();

  const gate = canPublish({...invitation, onlineUntil: new Date(onlineUntil), now});
  const url = shareUrl(invitation, locale);
  const svg = await QRCode.toString(url, {
    type: 'svg',
    margin: 1,
    color: {dark: '#07271e', light: '#0000'},
  });

  const editsLeft = Math.max(0, invitation.editsAllowed - invitation.editsUsed);
  const daysLeft = invitation.onlineUntil
    ? Math.max(0, Math.ceil((new Date(invitation.onlineUntil).getTime() - now.getTime()) / 86_400_000))
    : 0;

  const whatsappText = encodeURIComponent(
    `${t('share.message', {
      first: invitation.couple.first,
      second: invitation.couple.second,
    })} ${url}`,
  );

  async function publish() {
    'use server';
    await publishInvitationAction({locale, id});
  }

  const isPublished = invitation.status === 'published';

  return (
    <div className="invitation-manage-content">
      {/* Sub-nav tabs */}
      <nav className="invitation-tabs-bar" aria-label={t('invitation.tabsLabel')}>
        <Link className="tab-pill is-active" aria-current="page" href={`/app/invitations/${id}`}>
          {t('invitation.tabOverview')}
        </Link>
        <Link className="tab-pill" href={`/app/invitations/${id}/guests`}>
          {t('invitation.tabGuests')}
        </Link>
      </nav>

      {/* Header */}
      <header className="invitation-manage-header">
        <div className="header-meta-row">
          <span className="template-name-kicker">{templateName}</span>
          <span className={`status-badge status-badge--${invitation.status}`}>
            {t(`statuses.${invitation.status}`)}
          </span>
        </div>
        <div className="header-main-row">
          <h1 className="invitation-couple-title">
            {invitation.couple.first} <span>&amp;</span> {invitation.couple.second}
          </h1>
          <a
            className="btn-secondary"
            href={`/i/${invitation.shareSlug}`}
            target="_blank"
            rel="noreferrer"
          >
            <IconExternalLink size={16} />
            <span>{t('home.preview')}</span>
          </a>
        </div>
        <p className="invitation-date-text">
          {formatDate(invitation.eventDate, locale)}
        </p>
      </header>

      {/* 3-step Journey path */}
      <section className="journey-path" aria-label="مراحل تجهيز الدعوة">
        <ol className="journey-steps-list">
          <li className="journey-step is-done">
            <span className="journey-step-bubble"><IconCheck size={14} /></span>
            <span className="journey-step-label">{t('invitation.journeyStep1')}</span>
          </li>
          <li className={`journey-step ${isPublished ? 'is-done' : 'is-current'}`}>
            <span className="journey-step-bubble">
              {isPublished ? <IconCheck size={14} /> : 2}
            </span>
            <span className="journey-step-label">{t('invitation.journeyStep2')}</span>
          </li>
          <li className={`journey-step ${isPublished ? 'is-current' : 'is-upcoming'}`}>
            <span className="journey-step-bubble">3</span>
            <span className="journey-step-label">{t('invitation.journeyStep3')}</span>
          </li>
        </ol>
      </section>

      {/* Honest meters */}
      <DashboardMeters
        invitation={invitation}
        now={now}
        large
        labels={{
          edits: t('home.edits'),
          editsValue: t('home.editsValue', {left: editsLeft, allowed: invitation.editsAllowed}),
          days: t('home.daysOnline'),
          daysValue: t('home.daysValue', {days: daysLeft}),
          starts: t('home.startsOnPublish'),
        }}
      />

      {/* Publish card */}
      <section className="manage-publish-card">
        <div className="publish-card-info">
          <h2>{t('invitation.publishTitle')}</h2>
          <p>{gate.ok ? t('invitation.publishHelp') : t(`errors.${gate.reason}`)}</p>
          {isPublished && invitation.onlineUntil && (
            <p className="published-success-note">
              {t('invitation.onlineUntil', {
                date: formatDate(invitation.onlineUntil, locale),
                edits: editsLeft,
              })}
            </p>
          )}
        </div>
        <form action={publish}>
          <button className="btn-primary" type="submit" disabled={!gate.ok}>
            {gate.ok ? t('invitation.publish') : t(`errors.${gate.reason}`)}
          </button>
        </form>
      </section>

      {/* Share card */}
      <section className="manage-share-card">
        <div className="share-card-header">
          <p className="eyebrow">{t('share.eyebrow')}</p>
          <h2>{t('share.title')}</h2>
          <p>{t('share.description')}</p>
        </div>

        <div className="share-card-body">
          <div className="share-link-group">
            <div className="share-link-box">
              <span className="share-url-text" dir="ltr"><Bidi>{url}</Bidi></span>
              <CopyButton
                value={url}
                label={t('share.copy')}
                copiedLabel={t('share.copied')}
                className="btn-secondary"
              />
            </div>
            <p className="share-launch-note">{t('share.launchNote')}</p>
            <a
              className="btn-primary whatsapp-share-btn"
              href={`https://wa.me/?text=${whatsappText}`}
              target="_blank"
              rel="noreferrer"
            >
              <IconWhatsApp size={20} />
              <span>{t('share.whatsapp')}</span>
            </a>
          </div>

          <div
            className="qr-card-frame"
            aria-label={t('share.qrLabel')}
            // eslint-disable-next-line react/no-danger -- SVG generated server-side by QRCode from our validated share URL, not user-supplied markup.
            dangerouslySetInnerHTML={{__html: svg}}
          />
        </div>
      </section>

      {/* Guests link card */}
      <Link className="guests-nav-card" href={`/app/invitations/${id}/guests`}>
        <div className="guests-nav-card__icon" aria-hidden="true">
          <IconUsers size={24} />
        </div>
        <div className="guests-nav-card__content">
          <p className="eyebrow">{t('invitation.guestsEyebrow')}</p>
          <h2>{t('invitation.guestsTitle')}</h2>
          <p>
            {t('invitation.guestsDescription', {
              responses: rsvps.length,
              attending: rsvps
                .filter((rsvp) => rsvp.attending)
                .reduce((sum, rsvp) => sum + rsvp.guests, 0),
            })}
          </p>
        </div>
        <div className="guests-nav-card__arrow">
          <IconChevron size={20} />
        </div>
      </Link>
    </div>
  );
}
