'use client';

import {useTranslations} from 'next-intl';

/** "Download as PDF" is the browser's print dialog (Save as PDF). */
export function PrintButton() {
  const t = useTranslations('customer.receipt');
  return (
    <button type="button" className="btn-primary" onClick={() => window.print()}>
      {t('print')}
    </button>
  );
}
