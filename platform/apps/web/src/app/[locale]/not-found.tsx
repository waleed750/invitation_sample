import '@/styles/public.css';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';

export default async function LocaleNotFound() {
  const t = await getTranslations('public.notFound');
  return (
    <main className="public-status-page" data-testid="not-found">
      <div>
        <p className="eyebrow">404</p>
        <h1>{t('title')}</h1>
        <p>{t('lead')}</p>
        <Link className="button" href="/">{t('home')}</Link>
      </div>
    </main>
  );
}
