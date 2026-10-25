import 'server-only';
import {getTranslations} from 'next-intl/server';

interface PublicSettings {
  supportWhatsapp: string;
  paymentInstructions: {ar: string; en: string};
}

async function load(): Promise<PublicSettings | null> {
  const base = process.env.API_BASE_URL?.replace(/\/+$/, '');
  if (!base) return null;
  try {
    const response = await fetch(`${base}/v1/settings/public`, {cache: 'no-store', signal: AbortSignal.timeout(2500)});
    return response.ok ? ((await response.json()) as PublicSettings) : null;
  } catch {
    return null;
  }
}

/** The transfer instructions and the support WhatsApp link the owner set in Admin → Settings (nothing when unset). */
export async function SupportNote({locale}: {locale: 'ar' | 'en'}) {
  const settings = await load();
  if (settings === null) return null;
  const text = settings.paymentInstructions[locale].trim();
  const digits = settings.supportWhatsapp.replace(/[^0-9]/g, '');
  if (text === '' && digits === '') return null;
  const t = await getTranslations('customer.support');
  return (
    <aside className="customer-note" data-testid="support-note">
      {text !== '' && <p style={{whiteSpace: 'pre-line', margin: 0}}>{text}</p>}
      {digits !== '' && <p style={{margin: 0}}><a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer">{t('whatsapp')}</a></p>}
    </aside>
  );
}
