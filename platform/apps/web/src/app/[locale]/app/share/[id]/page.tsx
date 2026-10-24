import '@/styles/customer.css';
import QRCode from 'qrcode';
import {notFound} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Bidi} from '@/components/Bidi';
import {getCommerceClient} from '@/commerce';
import {CopyButton} from '@/commerce/CopyButton';
import {shareUrl} from '@/commerce/share';
import {Link} from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

export default async function SharePage({params}: {params: Promise<{locale: 'ar' | 'en'; id: string}>}) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const invitation = await getCommerceClient().getInvitation(id);
  if (!invitation) notFound();

  const t = await getTranslations('customer.share');
  const url = shareUrl(invitation, locale);
  // A PNG the customer can download and print (the page shows it too). 1024px stays sharp on a printed card.
  const png = await QRCode.toDataURL(url, {width: 1024, margin: 2, color: {dark: '#07271e', light: '#ffffff'}});
  const names = {first: invitation.couple.first, second: invitation.couple.second};
  const textFor = async (lang: 'ar' | 'en') => {
    const tr = await getTranslations({locale: lang, namespace: 'customer.share'});
    return `${tr('message', names)} ${shareUrl(invitation, lang)}`;
  };
  const [arText, enText] = await Promise.all([textFor('ar'), textFor('en')]);
  const whatsapp = (text: string) => `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <div className="share-page">
      <header className="page-heading">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p>{invitation.status === 'published' ? t('live') : t('draftNote')}</p>
      </header>

      <section className="upgrade-card">
        <h2>{t('link')}</h2>
        <p dir="ltr" data-testid="share-url"><Bidi>{url}</Bidi></p>
        <div className="share-actions">
          <CopyButton value={url} label={t('copy')} copiedLabel={t('copied')} className="btn-secondary" />
          <a className="btn-primary" href={whatsapp(locale === 'ar' ? arText : enText)} target="_blank" rel="noreferrer" data-testid="whatsapp-current">{t('whatsapp')}</a>
          <a className="btn-secondary" href={whatsapp(locale === 'ar' ? enText : arText)} target="_blank" rel="noreferrer" data-testid="whatsapp-other">{t(locale === 'ar' ? 'whatsappEn' : 'whatsappAr')}</a>
        </div>
      </section>

      <section className="share-qr">
        <h2>{t('qr')}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element -- a generated data: URL, nothing to optimise */}
        <img src={png} alt={t('qrAlt')} width={256} height={256} data-testid="share-qr" />
        <a className="btn-primary" href={png} download="invitation-qr.png" data-testid="qr-download">{t('qrDownload')}</a>
      </section>

      <Link className="btn-secondary" href={`/app/invitations/${invitation.id}`}>{t('back')}</Link>
    </div>
  );
}
