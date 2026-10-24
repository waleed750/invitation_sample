import '@/styles/admin-more.css';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {ActionForm} from '@/admin/more/ActionForm';
import {adminGet} from '@/admin/more/call';
import {createTemplateAction} from '@/admin/more/actions';
import {TemplateFields} from '@/admin/more/TemplateFields';
import {Link} from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

interface Row {
  id: string; slug: string; name_ar: string; name_en: string; tier: string; category: string | null; status: string; featured: boolean;
  sort_order: number; asset_count: number; unlicensed_count: number;
}

export default async function AdminTemplatesPage({params}: {params: Promise<{locale: 'ar' | 'en'}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('adminMore.templates');
  const rows = await adminGet<Row[]>('/v1/admin/templates');

  return (
    <div className="am-page" data-testid="admin-templates">
      <h1>{t('title')}</h1>
      <section className="am-card">
        <div className="am-table-wrap">
          <table className="am-table">
            <thead><tr><th>{t('slug')}</th><th>{t('name')}</th><th>{t('tier')}</th><th>{t('status')}</th><th>{t('licenses')}</th><th /></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} data-testid="template-row" data-slug={row.slug} data-status={row.status}>
                  <td dir="ltr" className="am-mono">{row.slug}</td>
                  <td>{locale === 'ar' ? row.name_ar : row.name_en}{row.featured ? ' ★' : ''}</td>
                  <td>{t(`tiers.${row.tier}`)}</td>
                  <td><span className={`am-badge ${row.status === 'live' ? 'am-badge--live' : row.status === 'retired' ? 'am-badge--retired' : ''}`}>{t(`statuses.${row.status}`)}</span></td>
                  <td>{row.unlicensed_count > 0 ? <span className="am-badge am-badge--warn">{t('missing', {count: row.unlicensed_count})}</span> : t('assets', {count: row.asset_count})}</td>
                  <td><Link href={`/admin/templates/${row.id}`}>{t('open')}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="am-card">
        <h2>{t('create')}</h2>
        <ActionForm action={createTemplateAction} submitLabel={t('createButton')} testId="form-template" resetOnSuccess>
          <label>{t('slug')}<input name="slug" required dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
          <TemplateFields />
        </ActionForm>
      </section>
    </div>
  );
}
