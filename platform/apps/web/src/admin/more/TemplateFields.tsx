import {getTranslations} from 'next-intl/server';

interface Values {
  name_ar?: string; name_en?: string; tagline?: {ar?: string; en?: string} | null; tier?: string; category?: string | null;
  event_type?: string | null; sort_order?: number; featured?: boolean; sample_data_ar?: unknown; sample_data_en?: unknown;
}

/** The fields shared by "new template" and "edit template". */
export async function TemplateFields({values = {}}: {values?: Values}) {
  const t = await getTranslations('adminMore.templates');
  const json = (value: unknown): string => (value === undefined || (typeof value === 'object' && value !== null && Object.keys(value).length === 0) ? '' : JSON.stringify(value, null, 2));
  return (
    <>
      <div className="am-grid">
        <label>{t('nameAr')}<input name="nameAr" required dir="rtl" defaultValue={values.name_ar ?? ''} maxLength={120} /></label>
        <label>{t('nameEn')}<input name="nameEn" required dir="ltr" defaultValue={values.name_en ?? ''} maxLength={120} /></label>
        <label>{t('taglineAr')}<input name="taglineAr" dir="rtl" defaultValue={values.tagline?.ar ?? ''} maxLength={240} /></label>
        <label>{t('taglineEn')}<input name="taglineEn" dir="ltr" defaultValue={values.tagline?.en ?? ''} maxLength={240} /></label>
        <label>{t('tier')}
          <select name="tier" defaultValue={values.tier ?? 'classic'}>
            <option value="save_the_date">{t('tiers.save_the_date')}</option>
            <option value="classic">{t('tiers.classic')}</option>
            <option value="premium">{t('tiers.premium')}</option>
          </select>
        </label>
        <label>{t('category')}<input name="category" defaultValue={values.category ?? ''} maxLength={60} /></label>
        <label>{t('eventType')}<input name="eventType" defaultValue={values.event_type ?? ''} maxLength={60} /></label>
        <label>{t('sortOrder')}<input name="sortOrder" type="number" min="0" step="1" defaultValue={values.sort_order ?? 100} /></label>
        <label><span><input name="featured" type="checkbox" defaultChecked={values.featured ?? false} style={{inlineSize: 'auto'}} /> {t('featured')}</span></label>
      </div>
      <label>{t('sampleAr')}<textarea name="sampleDataAr" dir="ltr" defaultValue={json(values.sample_data_ar)} spellCheck={false} /></label>
      <label>{t('sampleEn')}<textarea name="sampleDataEn" dir="ltr" defaultValue={json(values.sample_data_en)} spellCheck={false} /></label>
    </>
  );
}
