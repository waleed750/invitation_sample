import '@/styles/balance.css';
import '@/styles/customer.css';
import {SupportNote} from '@/customer/SupportNote';
import {redirect} from 'next/navigation';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {BalanceView} from '@/balance/BalanceView';
import {NotSignedInError} from '@/commerce/api-errors';
import {getBalance, getLedger, getTopups} from '@/balance/server';

export const dynamic = 'force-dynamic';

export default async function BalancePage({
  params,
  searchParams,
}: {
  params: Promise<{locale: 'ar' | 'en'}>;
  searchParams: Promise<{need?: string}>;
}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const {need} = await searchParams;
  const t = await getTranslations('balance');

  let data;
  try {
    data = await Promise.all([getBalance(), getLedger(), getTopups()]);
  } catch (error) {
    if (error instanceof NotSignedInError) redirect(`/${locale}/sign-in?next=${encodeURIComponent(`/${locale}/app/balance`)}`);
    throw error;
  }
  const [balance, ledger, topups] = data;
  const needed = Number(need);
  return (
    <div className="balance-shell">
      <h1 className="balance-title">{t('title')}</h1>
      <SupportNote locale={locale} />
      <BalanceView
        initial={balance}
        ledger={ledger.items}
        topups={topups}
        suggestedMinor={Number.isFinite(needed) && needed > 0 ? needed : balance.shortfallMinor}
      />
    </div>
  );
}
