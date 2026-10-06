import QRCode from 'qrcode';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {canPublish, computeOnlineUntil} from '@platform/shared';
import {Bidi} from '@/components/Bidi';
import {getCommerceClient} from '@/commerce';
import {getPublicStore} from '@/guest';
import {CopyButton} from '@/commerce/CopyButton';
import {DashboardMeters} from '@/commerce/DashboardMeters';
import {publishInvitationAction} from '@/commerce/dashboard-actions';
import {shareUrl} from '@/commerce/share';
import {formatDate} from '@/lib/format';
import {Link} from '@/i18n/navigation';

export default async function InvitationPage({params}: {params: Promise<{locale: 'ar' | 'en'; id: string}>}) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const invitation = await getCommerceClient().getInvitation(id);
  if (!invitation) notFound();
  const rsvps = await getPublicStore().listRsvps(invitation.shareSlug);
  const t = await getTranslations('dashboard');
  const now = new Date();
  const onlineUntil = invitation.onlineUntil ?? computeOnlineUntil({tier: invitation.tier, firstPublishedAt: now, eventDate: new Date(invitation.eventDate)}).toISOString();
  const gate = canPublish({...invitation, onlineUntil: new Date(onlineUntil), now});
  const url = shareUrl(invitation, locale);
  const svg = await QRCode.toString(url, {type: 'svg', margin: 1, color: {dark: '#193c32', light: '#0000'}});
  const editsLeft = Math.max(0, invitation.editsAllowed - invitation.editsUsed);
  const daysLeft = invitation.onlineUntil ? Math.max(0, Math.ceil((new Date(invitation.onlineUntil).getTime() - now.getTime()) / 86_400_000)) : 0;
  const whatsappText = encodeURIComponent(`${t('share.message', {first: invitation.couple.first, second: invitation.couple.second})} ${url}`);
  async function publish() {
    'use server';
    await publishInvitationAction({locale, id});
  }
  return <>
    <nav className="invitation-tabs" aria-label={t('invitation.tabsLabel')}><Link className="active" aria-current="page" href={`/app/invitations/${id}`}>{t('invitation.tabOverview')}</Link><Link href={`/app/invitations/${id}/guests`}>{t('invitation.tabGuests')}</Link></nav>
    <header className="page-heading"><p className="eyebrow">{t('invitation.eyebrow')}</p><h1>{invitation.couple.first} <span>&amp;</span> {invitation.couple.second}</h1><p>{t('invitation.description')}</p></header>
    <DashboardMeters invitation={invitation} now={now} large labels={{edits: t('home.edits'), editsValue: t('home.editsValue', {left: editsLeft, allowed: invitation.editsAllowed}), days: t('home.daysOnline'), daysValue: t('home.daysValue', {days: daysLeft}), starts: t('home.startsOnPublish')}} />
    <section className="publish-card"><div><h2>{t('invitation.publishTitle')}</h2><p>{gate.ok ? t('invitation.publishHelp') : t(`errors.${gate.reason}`)}</p>{invitation.status === 'published' && invitation.onlineUntil && <p className="published-note">{t('invitation.onlineUntil', {date: formatDate(invitation.onlineUntil, locale), edits: editsLeft})}</p>}</div><form action={publish}><button className="button" type="submit" disabled={!gate.ok}>{gate.ok ? t('invitation.publish') : t(`errors.${gate.reason}`)}</button></form></section>
    <section className="share-card"><div><p className="eyebrow">{t('share.eyebrow')}</p><h2>{t('share.title')}</h2><p>{t('share.description')}</p></div><div className="share-content"><div className="share-link"><Bidi>{url}</Bidi><CopyButton value={url} label={t('share.copy')} copiedLabel={t('share.copied')} /></div><p className="launch-note">{t('share.launchNote')}</p><a className="button whatsapp-button" href={`https://wa.me/?text=${whatsappText}`}>{t('share.whatsapp')}</a></div><div className="qr-code" aria-label={t('share.qrLabel')}
      // This SVG is generated server-side by QRCode from our validated share URL, not user-supplied markup.
      dangerouslySetInnerHTML={{__html: svg}} /></section>
    <Link className="coming-card guests-link-card" href={`/app/invitations/${id}/guests`}><span aria-hidden="true">♙</span><div><p className="eyebrow">{t('invitation.guestsEyebrow')}</p><h2>{t('invitation.guestsTitle')}</h2><p>{t('invitation.guestsDescription', {responses: rsvps.length, attending: rsvps.filter((rsvp) => rsvp.attending).reduce((sum, rsvp) => sum + rsvp.guests, 0)})}</p></div><strong aria-hidden="true">→</strong></Link>
  </>;
}
