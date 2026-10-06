import {getTranslations, setRequestLocale} from 'next-intl/server';
import {levelForPurchases} from '@platform/shared';
import {getCommerceClient} from '@/commerce';
import {DashboardMeters} from '@/commerce/DashboardMeters';
import {Link} from '@/i18n/navigation';
import {getTemplate} from '@/templates/registry';

const DAY_MS = 86_400_000;

export default async function DashboardHome({params}: {params: Promise<{locale: 'ar' | 'en'}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const client = getCommerceClient();
  const [session, invitations, points] = await Promise.all([client.getSession(), client.listInvitations(), client.getPoints()]);
  const t = await getTranslations('dashboard');
  const now = new Date();
  const level = levelForPurchases(points.purchaseCount);
  return <>
    <section className="dashboard-welcome"><div><p className="eyebrow">{t('home.eyebrow')}</p><h1>{t('home.greeting')}</h1><p>{t('home.signedIn', {phone: session?.phone ?? ''})}</p></div><div className={`level-card ${level}`}><span>{t(`levels.${level}`)}</span><strong>{t('home.pointsBalance', {points: points.balance})}</strong></div></section>
    <div className="section-heading"><div><p className="eyebrow">{t('home.collectionEyebrow')}</p><h2>{t('home.title')}</h2></div><Link className="text-link" href="/templates">{t('home.browse')}</Link></div>
    {invitations.length === 0 ? <section className="dashboard-empty"><span aria-hidden="true">◇</span><h3>{t('home.emptyTitle')}</h3><p>{t('home.emptyDescription')}</p><Link className="button" href="/templates">{t('home.emptyAction')}</Link></section> : <div className="invitation-grid">{invitations.map((invitation) => {
      const template = getTemplate(invitation.templateSlug);
      const daysToEvent = Math.max(0, Math.ceil((new Date(invitation.eventDate).getTime() - now.getTime()) / DAY_MS));
      const values = {editsLeft: Math.max(0, invitation.editsAllowed - invitation.editsUsed), daysLeft: invitation.onlineUntil ? Math.max(0, Math.ceil((new Date(invitation.onlineUntil).getTime() - now.getTime()) / DAY_MS)) : 0};
      const templateName = typeof template?.entry.name === 'string' ? template.entry.name : template?.entry.name[locale];
      return <article className="invitation-card" key={invitation.id}><div className="invitation-card-top"><div><p className="template-name">{templateName ?? invitation.templateSlug}</p><h3>{invitation.couple.first} <span>&amp;</span> {invitation.couple.second}</h3></div><span className={`status-badge ${invitation.status}`}>{t(`statuses.${invitation.status}`)}</span></div><p className="event-countdown">{t('home.eventCountdown', {days: daysToEvent})}</p><DashboardMeters invitation={invitation} now={now} labels={{edits: t('home.edits'), editsValue: t('home.editsValue', {left: values.editsLeft, allowed: invitation.editsAllowed}), days: t('home.daysOnline'), daysValue: t('home.daysValue', {days: values.daysLeft}), starts: t('home.startsOnPublish')}} /><div className="card-actions"><Link className="button" href={`/app/invitations/${invitation.id}`}>{t('home.open')}</Link><Link className="small-button" href={`/checkout/${invitation.templateSlug}?tier=${invitation.tier}&kind=edits`}>{t('home.buyEdits')}</Link><Link className="small-button" href={`/checkout/${invitation.templateSlug}?tier=${invitation.tier}&kind=extension`}>{t('home.extend')}</Link></div></article>;
    })}</div>}
  </>;
}
