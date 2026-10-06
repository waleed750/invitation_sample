import {getTranslations, setRequestLocale} from 'next-intl/server';
import {levelForPurchases, maxRedeemableEgp, type Level} from '@platform/shared';
import {Bidi} from '@/components/Bidi';
import {getCommerceClient} from '@/commerce';
import {formatDate, formatMoney} from '@/lib/format';

function nextLevel(count: number): {level: Level; target: number} | null {
  const current = levelForPurchases(count);
  for (let target = count + 1; target < count + 100; target += 1) {
    const level = levelForPurchases(target);
    if (level !== current) return {level, target};
  }
  return null;
}

export default async function PointsPage({params}: {params: Promise<{locale: 'ar' | 'en'}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const [points, t] = await Promise.all([getCommerceClient().getPoints(), getTranslations('dashboard')]);
  const next = nextLevel(points.purchaseCount);
  const progressStart = points.level === 'silver' ? nextLevel(0)?.target ?? 0 : 0;
  const pct = next ? Math.round((points.purchaseCount - progressStart) / (next.target - progressStart) * 100) : 100;
  const exampleRedeem = maxRedeemableEgp(1000, points.balance);
  return <><header className="page-heading"><p className="eyebrow">{t('points.eyebrow')}</p><h1>{t('points.title')}</h1><p>{t('points.description')}</p></header><section className="points-hero"><div><span>{t('points.balance')}</span><strong><Bidi>{points.balance}</Bidi></strong><small>{t('points.points')}</small></div><div><span className={`level-pill ${points.level}`}>{t(`levels.${points.level}`)}</span><p>{next ? t('points.nextLevel', {count: next.target - points.purchaseCount, level: t(`levels.${next.level}`)}) : t('points.topLevel')}</p><div className="meter-track" role="progressbar" aria-label={t('points.levelProgress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><span style={{inlineSize: `${pct}%`}} /></div></div></section><section className="rules-card"><h2>{t('points.redeemTitle')}</h2><p>{t('points.redeemRules')}</p><p>{t('points.redeemExample', {amount: formatMoney(exampleRedeem, locale)})}</p></section><section className="ledger"><h2>{t('points.history')}</h2>{points.ledger.length === 0 ? <p>{t('points.empty')}</p> : <div className="ledger-list">{points.ledger.map((entry) => <article key={entry.id}><div><strong>{t(`points.reasons.${entry.reason === 'redeem' ? 'redeem' : 'purchase'}`)}</strong><time dateTime={entry.createdAt}>{formatDate(entry.createdAt, locale)}</time>{entry.expiresAt && <small>{t('points.expires', {date: formatDate(entry.expiresAt, locale)})}</small>}</div><Bidi>{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</Bidi></article>)}</div>}</section></>;
}
