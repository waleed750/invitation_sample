import {TIERS} from '@platform/shared';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {getCommerceClient} from '@/commerce';
import {IconDownload} from '@/commerce/icons';
import {getPublicStore} from '@/guest';
import {GuestList} from '@/guest/GuestList';
import {Link} from '@/i18n/navigation';
import {formatDate} from '@/lib/format';

export default async function GuestsPage({
  params,
}: {
  params: Promise<{locale: 'ar' | 'en'; id: string}>;
}) {
  const {locale, id} = await params;
  setRequestLocale(locale);

  const invitation = await getCommerceClient().getInvitation(id);
  if (!invitation) notFound();

  const store = getPublicStore();
  const [snapshot, rsvps, messages] = await Promise.all([
    store.getBySlug(invitation.shareSlug),
    store.listRsvps(invitation.shareSlug),
    store.listMessages(invitation.shareSlug),
  ]);

  const t = await getTranslations('guests');
  const attending = rsvps.filter((rsvp) => rsvp.attending);
  const declined = rsvps.length - attending.length;
  const totalGuests = attending.reduce((sum, rsvp) => sum + rsvp.guests, 0);
  const limit = TIERS[invitation.tier].rsvpLimit;
  const remaining = limit === null ? null : Math.max(0, limit - totalGuests);
  const newestMessages = [...messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="guests-page-content">
      {/* Sub-nav tabs */}
      <nav className="invitation-tabs-bar" aria-label={t('tabs.label')}>
        <Link className="tab-pill" href={`/app/invitations/${id}`}>
          {t('tabs.overview')}
        </Link>
        <Link className="tab-pill is-active" aria-current="page" href={`/app/invitations/${id}/guests`}>
          {t('tabs.guests')}
        </Link>
      </nav>

      {/* Header */}
      <header className="page-heading">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p>
          {t('description', {
            first: `\u2068${invitation.couple.first}\u2069`,
            second: `\u2068${invitation.couple.second}\u2069`,
          })}
        </p>
      </header>

      {/* Stats tiles */}
      <section className="guest-stats-grid" aria-label={t('stats.label')}>
        <article className="guest-stat-card">
          <span className="stat-label">{t('stats.attending')}</span>
          <strong className="stat-number">{attending.length}</strong>
        </article>
        <article className="guest-stat-card">
          <span className="stat-label">{t('stats.declined')}</span>
          <strong className="stat-number">{declined}</strong>
        </article>
        <article className="guest-stat-card">
          <span className="stat-label">{t('stats.totalGuests')}</span>
          <strong className="stat-number">{totalGuests}</strong>
        </article>
        <article className="guest-stat-card">
          <span className="stat-label">{t('stats.remaining')}</span>
          <strong className="stat-number">
            {remaining === null ? t('stats.unlimited') : remaining}
          </strong>
        </article>
      </section>

      {/* Guests table panel */}
      <section className="guests-panel">
        <div className="guests-panel-header">
          <div>
            <h2>{t('list.title')}</h2>
            <p className="guests-updated-text">
              {snapshot
                ? t('list.updated', {date: formatDate(snapshot.publishedAt, locale)})
                : t('list.notPublished')}
            </p>
          </div>
          <a
            className="btn-secondary"
            href={`/${locale}/app/invitations/${id}/guests/export`}
          >
            <IconDownload size={16} />
            <span>{t('list.export')}</span>
          </a>
        </div>

        <GuestList
          rsvps={rsvps}
          locale={locale}
          labels={{
            search: t('list.search'),
            empty: t('list.empty'),
            name: t('list.name'),
            phone: t('list.phone'),
            response: t('list.response'),
            guests: t('list.guests'),
            note: t('list.note'),
            date: t('list.date'),
            attending: t('list.attending'),
            declined: t('list.declined'),
            whatsapp: t('list.whatsapp'),
            whatsappMessage: t('list.whatsappMessage'),
          }}
        />
      </section>

      {/* Guestbook messages panel */}
      <section className="messages-panel">
        <div className="messages-panel-header">
          <p className="eyebrow">{t('messages.eyebrow')}</p>
          <h2>{t('messages.title')}</h2>
        </div>
        {newestMessages.length === 0 ? (
          <p className="guests-empty">{t('messages.empty')}</p>
        ) : (
          <div className="message-list">
            {newestMessages.map((message) => (
              <article key={message.id} className="message-item-card">
                <div className="message-item-header">
                  <strong>{message.name}</strong>
                  <time dateTime={message.createdAt}>
                    {formatDate(message.createdAt, locale)}
                  </time>
                </div>
                <p className="message-item-text">{message.text}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
