import {getTranslations, setRequestLocale} from 'next-intl/server';
import {levelForPurchases} from '@platform/shared';
import {Bidi} from '@/components/Bidi';
import {getCommerceClient} from '@/commerce';
import {signOutAction} from '@/commerce/dashboard-actions';
import {
  IconCheck,
  IconChevron,
  IconSparkles,
  IconWhatsApp,
} from '@/commerce/icons';
import {LanguageSwitcher} from '@/components/LanguageSwitcher';
import {Link} from '@/i18n/navigation';

export default async function AccountPage({
  params,
}: {
  params: Promise<{locale: 'ar' | 'en'}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const client = getCommerceClient();
  const [session, invitations, points, t] = await Promise.all([
    client.getSession(),
    client.listInvitations(),
    client.getPoints(),
    getTranslations('dashboard'),
  ]);

  const latestInvitation = invitations[0];
  const coupleNames = latestInvitation
    ? `${latestInvitation.couple.first} & ${latestInvitation.couple.second}`
    : null;
  const currentLevel = levelForPurchases(points.purchaseCount);

  return (
    <div className="account-page-content">
      <header className="page-heading">
        <p className="eyebrow">{t('account.eyebrow')}</p>
        <h1>{t('account.title')}</h1>
        <p>{t('account.description')}</p>
      </header>

      <div className="account-cards-stack">
        {/* 1. PROFILE CARD */}
        <section className="account-group-card" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="account-group-title">
            {t('account.profile')}
          </h2>
          <div className="account-group-body">
            <div className="account-row-item">
              <div className="account-row-label">
                <span>{t('account.phone')}</span>
                <small>{t('account.verified')}</small>
              </div>
              <div className="account-phone-badge">
                <span className="verified-check" aria-hidden="true">
                  <IconCheck size={14} />
                </span>
                <strong dir="ltr" className="phone-number">
                  <Bidi>{session?.phone ?? '—'}</Bidi>
                </strong>
              </div>
            </div>

            {coupleNames && (
              <div className="account-row-item">
                <div className="account-row-label">
                  <span>{t('account.couple')}</span>
                </div>
                <strong className="account-couple-names">{coupleNames}</strong>
              </div>
            )}
          </div>
        </section>

        {/* 2. PREFERENCES CARD */}
        <section className="account-group-card" aria-labelledby="preferences-heading">
          <h2 id="preferences-heading" className="account-group-title">
            {t('account.preferences')}
          </h2>
          <div className="account-group-body">
            <div className="account-row-item">
              <div className="account-row-label">
                <span>{t('account.language')}</span>
                <small>{t('account.languageNote')}</small>
              </div>
              <div className="account-lang-wrap">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </section>

        {/* 3. REWARDS CARD */}
        <section className="account-group-card" aria-labelledby="rewards-heading">
          <h2 id="rewards-heading" className="account-group-title">
            {t('account.rewards')}
          </h2>
          <div className="account-group-body">
            <Link className="account-row-link" href="/app/points">
              <div className="account-row-label">
                <div className="rewards-badge-inline">
                  <IconSparkles size={18} />
                  <span>{t('account.viewPoints')}</span>
                </div>
                <small>
                  {points.balance} {t('points.points')} · {t(`levels.${currentLevel}`)}
                </small>
              </div>
              <div className="account-row-action">
                <IconChevron size={18} />
              </div>
            </Link>
          </div>
        </section>

        {/* 4. HELP & SUPPORT CARD */}
        <section className="account-group-card" aria-labelledby="help-heading">
          <h2 id="help-heading" className="account-group-title">
            {t('account.help')}
          </h2>
          <div className="account-group-body">
            <a
              className="account-row-link"
              href="https://wa.me/201000000000"
              target="_blank"
              rel="noreferrer"
            >
              <div className="account-row-label">
                <div className="rewards-badge-inline">
                  <IconWhatsApp size={18} />
                  <span>{t('account.whatsapp')}</span>
                </div>
                <small>{t('account.faq')}</small>
              </div>
              <div className="account-row-action">
                <IconChevron size={18} />
              </div>
            </a>
          </div>
        </section>

        {/* 5. SESSION & SIGN OUT */}
        <section className="account-group-card account-session-card" aria-labelledby="session-heading">
          <h2 id="session-heading" className="account-group-title">
            {t('account.session')}
          </h2>
          <div className="account-group-body">
            <form action={signOutAction} className="account-signout-form">
              <input type="hidden" name="locale" value={locale} />
              <button className="btn-secondary signout-btn" type="submit">
                {t('account.signOut')}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
