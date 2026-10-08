import {getTranslations, setRequestLocale} from 'next-intl/server';
import {levelForPurchases, type Level} from '@platform/shared';
import {Bidi} from '@/components/Bidi';
import {getCommerceClient} from '@/commerce';
import {
  IconCalendar,
  IconSparkles,
  IconStar,
} from '@/commerce/icons';
import {formatDate, formatMoney} from '@/lib/format';

function getNextLevel(count: number): {level: Level; target: number} | null {
  const current = levelForPurchases(count);
  for (let target = count + 1; target <= count + 50; target += 1) {
    const lvl = levelForPurchases(target);
    if (lvl !== current) return {level: lvl, target};
  }
  return null;
}

export default async function PointsPage({
  params,
}: {
  params: Promise<{locale: 'ar' | 'en'}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);

  const [points, t] = await Promise.all([
    getCommerceClient().getPoints(),
    getTranslations('dashboard'),
  ]);

  const currentLevel = levelForPurchases(points.purchaseCount);
  const next = getNextLevel(points.purchaseCount);

  // Compute honest level progress
  const progressStart = currentLevel === 'silver' ? (getNextLevel(0)?.target ?? 1) : 0;
  const progressTarget = next ? next.target : points.purchaseCount || 1;
  const progressDenom = Math.max(1, progressTarget - progressStart);
  const pct = next
    ? Math.max(0, Math.min(100, Math.round(((points.purchaseCount - progressStart) / progressDenom) * 100)))
    : 100;

  // EGP discount equivalent: 100 points = 50 EGP (0.5 EGP per point)
  const discountEgp = points.balance * 0.5;

  return (
    <div className="points-page-content">
      <header className="page-heading">
        <p className="eyebrow">{t('points.eyebrow')}</p>
        <h1>{t('points.title')}</h1>
        <p>{t('points.description')}</p>
      </header>

      {/* COMPACT SCENE BALANCE CARD (200px tall scene treatment) */}
      <section className="points-scene-card" aria-label={t('points.balance')}>
        <div className="points-scene-card__content">
          <div className="points-balance-group">
            <span className="points-balance-label">{t('points.balance')}</span>
            <div className="points-number-row">
              <strong className="points-huge-number">
                <Bidi>{points.balance}</Bidi>
              </strong>
              <span className="points-unit">{t('points.points')}</span>
              <span className="points-egp-chip">
                {t('points.egpDiscount', {amount: formatMoney(discountEgp, locale)})}
              </span>
            </div>
          </div>

          <div className="points-level-block">
            <div className="points-level-header">
              <span className={`level-pill level-pill--${currentLevel}`}>
                <IconStar size={13} />
                <span>{t(`levels.${currentLevel}`)}</span>
              </span>
              <p className="points-level-hint">
                {next
                  ? t('points.nextLevel', {
                      count: next.target - points.purchaseCount,
                      level: t(`levels.${next.level}`),
                    })
                  : t('points.topLevel')}
              </p>
            </div>

            <div
              className="honest-meter-track"
              role="progressbar"
              aria-label={t('points.levelProgress')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <div className="meter-fill-bar" style={{inlineSize: `${pct}%`}} />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (3 short rules as icon rows) */}
      <section className="points-rules-section" aria-labelledby="points-rules-title">
        <h2 id="points-rules-title" className="section-title">
          {t('points.howItWorks')}
        </h2>

        <div className="rules-cards-grid">
          <article className="rule-card">
            <div className="rule-card-icon" aria-hidden="true">
              <IconStar size={22} />
            </div>
            <div className="rule-card-text">
              <h3>{t('points.ruleEarnTitle')}</h3>
              <p>{t('points.ruleEarnDesc')}</p>
            </div>
          </article>

          <article className="rule-card">
            <div className="rule-card-icon" aria-hidden="true">
              <IconSparkles size={22} />
            </div>
            <div className="rule-card-text">
              <h3>{t('points.ruleRedeemTitle')}</h3>
              <p>{t('points.ruleRedeemDesc')}</p>
            </div>
          </article>

          <article className="rule-card">
            <div className="rule-card-icon" aria-hidden="true">
              <IconCalendar size={22} />
            </div>
            <div className="rule-card-text">
              <h3>{t('points.ruleExpiryTitle')}</h3>
              <p>{t('points.ruleExpiryDesc')}</p>
            </div>
          </article>
        </div>

        <div className="rules-policy-note">
          <p>{t('points.redeemRules')}</p>
        </div>
      </section>

      {/* HISTORY LEDGER */}
      <section className="points-ledger-section" aria-labelledby="ledger-title">
        <h2 id="ledger-title" className="section-title">
          {t('points.history')}
        </h2>

        {points.ledger.length === 0 ? (
          <div className="ledger-empty-card">
            <p>{t('points.empty')}</p>
          </div>
        ) : (
          <div className="ledger-list-wrap">
            {points.ledger.map((entry) => {
              const isPositive = entry.delta > 0;
              return (
                <article className="ledger-row-card" key={entry.id}>
                  <div className="ledger-row-info">
                    <strong className="ledger-row-reason">
                      {t(`points.reasons.${entry.reason === 'redeem' ? 'redeem' : 'purchase'}`)}
                    </strong>
                    <div className="ledger-row-meta">
                      <time dateTime={entry.createdAt}>
                        {formatDate(entry.createdAt, locale)}
                      </time>
                      {entry.expiresAt && (
                        <span className="ledger-expiry-tag">
                          {t('points.expires', {date: formatDate(entry.expiresAt, locale)})}
                        </span>
                      )}
                    </div>
                  </div>

                  <strong
                    className={`ledger-delta ${
                      isPositive ? 'is-positive' : 'is-negative'
                    }`}
                  >
                    <Bidi>{isPositive ? `+${entry.delta}` : entry.delta}</Bidi>
                  </strong>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
