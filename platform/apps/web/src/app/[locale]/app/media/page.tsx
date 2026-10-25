import '@/styles/media.css';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {MediaLibrary} from '@/media/MediaLibrary';

export default async function MediaPage({params}: {params: Promise<{locale: 'ar' | 'en'}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('media');
  return (
    <div className="media-page">
      <h1>{t('title')}</h1>
      <p className="media-page__lead">{t('lead')}</p>
      <MediaLibrary />
    </div>
  );
}
