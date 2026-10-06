import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Bidi} from '@/components/Bidi';
import {getCommerceClient} from '@/commerce';
import {signOutAction} from '@/commerce/dashboard-actions';
import {LanguageSwitcher} from '@/components/LanguageSwitcher';

export default async function AccountPage({params}: {params: Promise<{locale: 'ar' | 'en'}>}) {
  const {locale} = await params;
  setRequestLocale(locale);
  const [session, t] = await Promise.all([getCommerceClient().getSession(), getTranslations('dashboard')]);
  return <><header className="page-heading"><p className="eyebrow">{t('account.eyebrow')}</p><h1>{t('account.title')}</h1><p>{t('account.description')}</p></header><section className="account-card"><div><span>{t('account.phone')}</span><strong><Bidi>{session?.phone ?? '—'}</Bidi></strong><small>{t('account.verified')}</small></div><div><span>{t('account.language')}</span><LanguageSwitcher /><small>{t('account.languageNote')}</small></div></section><section className="account-actions"><form action={signOutAction}><input type="hidden" name="locale" value={locale} /><button className="button secondary-dashboard-button" type="submit">{t('account.signOut')}</button></form><div><button className="button delete-button" type="button" disabled>{t('account.delete')}</button><small>{t('account.comingSoon')}</small></div></section></>;
}
