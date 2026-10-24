import '@/styles/admin-more.css';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {ActionForm} from '@/admin/more/ActionForm';
import {adminGet} from '@/admin/more/call';
import {saveSettingAction} from '@/admin/more/actions';

export const dynamic = 'force-dynamic';

interface SettingRow {key: string; value: unknown; updated_at: string}
type Localized = {ar?: string; en?: string};

export default async function AdminSettingsPage({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const t = await getTranslations('adminMore.settings');
  const rows = await adminGet<SettingRow[]>('/v1/admin/settings');
  const get = (key: string): unknown => rows.find((row) => row.key === key)?.value;
  const instructions = (get('payment_instructions') ?? {}) as Localized;
  const whatsapp = typeof get('support_whatsapp') === 'string' ? (get('support_whatsapp') as string) : '';
  const texts = (get('email_texts') ?? {}) as Record<string, Localized>;
  const emailKeys = ['order_paid', 'topup_confirmed', 'invitation_published'] as const;

  return (
    <div className="am-page" data-testid="admin-settings">
      <h1>{t('title')}</h1>

      <section className="am-card">
        <h2>{t('whatsappTitle')}</h2>
        <p>{t('whatsappHelp')}</p>
        <ActionForm action={saveSettingAction} submitLabel={t('save')} testId="form-whatsapp">
          <input type="hidden" name="key" value="support_whatsapp" />
          <label>{t('whatsappLabel')}<input name="value" defaultValue={whatsapp} inputMode="tel" dir="ltr" placeholder="+201000000000" /></label>
        </ActionForm>
      </section>

      <section className="am-card">
        <h2>{t('instructionsTitle')}</h2>
        <p>{t('instructionsHelp')}</p>
        <ActionForm action={saveSettingAction} submitLabel={t('save')} testId="form-instructions">
          <input type="hidden" name="key" value="payment_instructions" />
          <label>{t('arabic')}<textarea name="ar" dir="rtl" defaultValue={instructions.ar ?? ''} maxLength={2000} /></label>
          <label>{t('english')}<textarea name="en" dir="ltr" defaultValue={instructions.en ?? ''} maxLength={2000} /></label>
        </ActionForm>
      </section>

      <section className="am-card">
        <h2>{t('emailsTitle')}</h2>
        <p>{t('emailsHelp')}</p>
        <ActionForm action={saveSettingAction} submitLabel={t('save')} testId="form-emails">
          <input type="hidden" name="key" value="email_texts" />
          {emailKeys.map((name) => (
            <fieldset key={name} className="am-card">
              <legend>{t(`emails.${name}`)}</legend>
              <label>{t('arabic')}<textarea name={`${name}_ar`} dir="rtl" defaultValue={texts[name]?.ar ?? ''} maxLength={2000} /></label>
              <label>{t('english')}<textarea name={`${name}_en`} dir="ltr" defaultValue={texts[name]?.en ?? ''} maxLength={2000} /></label>
            </fieldset>
          ))}
        </ActionForm>
      </section>
    </div>
  );
}
