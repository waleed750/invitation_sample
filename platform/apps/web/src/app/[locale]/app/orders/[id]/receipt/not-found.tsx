import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';

export default async function ReceiptNotFound() {
  const t = await getTranslations('customer.receipt');
  return (
    <div className="orders-page-content">
      <h1>{t('missingTitle')}</h1>
      <p>{t('missingBody')}</p>
      <Link className="btn-primary" href="/app/orders">{t('back')}</Link>
    </div>
  );
}
