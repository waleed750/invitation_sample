import {getTranslations, setRequestLocale} from 'next-intl/server';
import {AdminApi} from '@/admin/api';
import {KpiCards} from '@/admin/overview/KpiCards';

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.overview');

  const api = new AdminApi();
  const stats = await api.getStats();

  return (
    <div style={{padding: '1.5rem', maxWidth: '1000px', margin: '0 auto'}}>
      <h1 style={{fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--color-primary)'}}>
        {t('title')}
      </h1>
      <KpiCards stats={stats} locale={locale as 'ar' | 'en'} />
    </div>
  );
}
