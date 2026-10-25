import '@/styles/admin-more.css';
import {notFound} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {ActionForm} from '@/admin/more/ActionForm';
import {AssetRow, type AssetRowData} from '@/admin/more/AssetRow';
import {StatusButtons} from '@/admin/more/StatusButtons';
import {TemplateFields} from '@/admin/more/TemplateFields';
import {TemplatePreview} from '@/admin/more/TemplatePreview';
import {adminGet} from '@/admin/more/call';
import {addAssetAction, updateTemplateAction} from '@/admin/more/actions';
import {BalanceApiError} from '@/balance/server';
import {Link} from '@/i18n/navigation';

export const dynamic = 'force-dynamic';

interface Detail {
  template: {
    id: string; slug: string; name_ar: string; name_en: string; tagline: {ar?: string; en?: string} | null; tier: string; category: string | null;
    event_type: string | null; status: string; featured: boolean; sort_order: number; sample_data_ar: unknown; sample_data_en: unknown; unlicensed_count: number;
  };
  assets: AssetRowData[];
}

export default async function AdminTemplatePage({params}: {params: Promise<{locale: 'ar' | 'en'; id: string}>}) {
  const {locale, id} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('adminMore.templates');
  let detail: Detail;
  try {
    detail = await adminGet<Detail>(`/v1/admin/templates/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof BalanceApiError && (error.status === 404 || error.status === 400)) notFound();
    throw error;
  }
  const {template, assets} = detail;

  return (
    <div className="am-page" data-testid="admin-template" data-status={template.status}>
      <p><Link href="/admin/templates">{t('back')}</Link></p>
      <h1>{locale === 'ar' ? template.name_ar : template.name_en} <span className="am-badge" data-testid="template-status">{t(`statuses.${template.status}`)}</span></h1>

      <section className="am-card">
        <h2>{t('lifecycle')}</h2>
        <p>{t('lifecycleHelp')}</p>
        {template.unlicensed_count > 0 && <p className="am-error" role="status" data-testid="license-warning">{t('licenseWarning', {count: template.unlicensed_count})}</p>}
        <StatusButtons id={template.id} status={template.status} />
      </section>

      <section className="am-card">
        <h2>{t('details')}</h2>
        <ActionForm action={updateTemplateAction} submitLabel={t('save')} testId="form-template-edit">
          <input type="hidden" name="id" value={template.id} />
          <TemplateFields values={template} />
        </ActionForm>
      </section>

      <section className="am-card">
        <h2>{t('assetsTitle')}</h2>
        <p>{t('assetsHelp')}</p>
        {assets.map((asset) => <AssetRow key={asset.id} templateId={template.id} asset={asset} />)}
        <ActionForm action={addAssetAction} submitLabel={t('addAsset')} testId="form-asset-new" resetOnSuccess>
          <input type="hidden" name="templateId" value={template.id} />
          <div className="am-grid">
            <label>{t('assetKey')}<input name="r2Key" required dir="ltr" placeholder="templates/slug/hero.webp" /></label>
            <label>{t('assetKind')}
              <select name="kind" defaultValue="image"><option value="image">image</option><option value="video">video</option><option value="audio">audio</option><option value="font">font</option><option value="other">other</option></select>
            </label>
            <label>{t('source')}<input name="source" maxLength={500} /></label>
            <label>{t('license')}<input name="license" maxLength={200} /></label>
            <label>{t('licenseUrl')}<input name="licenseUrl" type="url" dir="ltr" /></label>
          </div>
        </ActionForm>
      </section>

      <section className="am-card">
        <h2>{t('preview')}</h2>
        <TemplatePreview slug={template.slug} />
      </section>
    </div>
  );
}
