import '@/styles/customer.css';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Bidi} from '@/components/Bidi';
import {getCommerceClient} from '@/commerce';
import {EXTENSION_PRICE_EGP, EXTRA_EDITS_PRICE_EGP} from '@/commerce/pricing';
import {UpgradeOffers} from '@/customer/UpgradeOffers';
import {formatDate} from '@/lib/format';
import {Link} from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

/** Edits added by one pack (kept in step with `fulfill_paid_order`, which adds +10). */
const EDITS_PER_PACK = 10;

export default async function UpgradesPage({
  params,
  searchParams,
}: {
  params: Promise<{locale: 'ar' | 'en'}>;
  searchParams: Promise<{invitation?: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const {invitation: wanted} = await searchParams;
  const t = await getTranslations('customer.upgrades');

  // Only invitations that can take an upgrade: paid ones (they have an online window and an edits counter).
  const all = await getCommerceClient().listInvitations();
  const upgradable = all.filter((item) => item.onlineUntil !== undefined || item.status === 'published');
  const current = upgradable.find((item) => item.id === wanted) ?? upgradable[0];

  if (!current) {
    return (
      <div className="orders-page-content">
        <header className="page-heading"><h1>{t('title')}</h1></header>
        <p>{t('none')}</p>
        <Link className="btn-primary" href="/templates">{t('browse')}</Link>
      </div>
    );
  }

  const now = Date.now();
  const editsLeft = Math.max(0, current.editsAllowed - current.editsUsed);
  const until = current.onlineUntil ? new Date(current.onlineUntil) : null;
  const expired = until !== null && until.getTime() <= now;
  const daysLeft = until === null ? null : Math.max(0, Math.ceil((until.getTime() - now) / 86_400_000));

  return (
    <div className="orders-page-content">
      <header className="page-heading">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p>{t('intro')}</p>
      </header>

      {upgradable.length > 1 && (
        <nav className="upgrade-picker" aria-label={t('pick')}>
          {upgradable.map((item) => (
            <Link key={item.id} href={`/app/upgrades?invitation=${item.id}`} aria-current={item.id === current.id ? 'page' : undefined}>
              {item.couple.first} &amp; {item.couple.second}
            </Link>
          ))}
        </nav>
      )}

      <section className="upgrade-card" aria-label={t('current')}>
        <h2>{current.couple.first} &amp; {current.couple.second}</h2>
        <ul className="upgrade-meters" data-testid="upgrade-meters">
          <li data-testid="meter-edits">{t('meters.edits', {count: editsLeft})}</li>
          <li data-testid="meter-days">
            {until === null
              ? t('meters.notPublished')
              : expired
                ? t('meters.expired', {date: formatDate(until, locale)})
                : t('meters.days', {count: daysLeft ?? 0, date: formatDate(until, locale)})}
          </li>
        </ul>
        {(editsLeft === 0 || expired) && <p className="customer-error" role="status">{expired ? t('hintExpired') : t('hintNoEdits')}</p>}
      </section>

      <UpgradeOffers
        invitationId={current.id}
        extensionPriceEgp={EXTENSION_PRICE_EGP}
        editsPriceEgp={EXTRA_EDITS_PRICE_EGP}
        editsPerPack={EDITS_PER_PACK}
      />
      <p className="receipt-note"><Bidi>{t('payNote')}</Bidi></p>
    </div>
  );
}
