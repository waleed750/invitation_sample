import {hasLocale} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {LanguageSwitcher} from '@/components/LanguageSwitcher';
import {Bidi} from '@/components/Bidi';
import {routing} from '@/i18n/routing';
import {formatMoney} from '@/lib/format';

export default async function Landing({params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('landing');
  const tiers = [{key: 'save', price: 499}, {key: 'classic', price: 1299}, {key: 'premium', price: 2499}] as const;
  return (
    <>
      <a className="skip-link" href="#main">{t('skip')}</a>
      <header className="site-header container">
        <a className="brand" href={`/${locale}`}>{t('brand')}</a>
        <LanguageSwitcher />
      </header>
      <main id="main">
        <section className="hero container" aria-labelledby="hero-title">
          <p className="eyebrow">{t('hero.eyebrow')}</p>
          <h1 id="hero-title">{t('hero.title')}</h1>
          <p className="hero-description">{t('hero.description')}</p>
          <a className="button" href="#pricing">{t('hero.action')}</a>
          <p className="hero-note">{t('hero.note')}</p>
        </section>
        <section className="section container" id="how" aria-labelledby="how-title">
          <p className="eyebrow">{t('how.eyebrow')}</p>
          <h2 id="how-title">{t('how.title')}</h2>
          <ol className="steps grid">
            {(['pick', 'personalize', 'share'] as const).map((step) => (
              <li key={step} className="step">
                <span className="step-number" aria-hidden="true">{t(`how.${step}.number`)}</span>
                <h3>{t(`how.${step}.title`)}</h3><p>{t(`how.${step}.description`)}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="pricing-band" id="pricing" aria-labelledby="pricing-title">
          <div className="section container">
            <p className="eyebrow">{t('pricing.eyebrow')}</p>
            <h2 id="pricing-title">{t('pricing.title')}</h2>
            <p className="section-intro">{t('pricing.description')}</p>
            <div className="grid">
              {tiers.map(({key, price}) => (
                <article className={`price-card ${key === 'classic' ? 'featured' : ''}`} key={key}>
                  <p className="eyebrow">{t(`pricing.${key}.audience`)}</p>
                  <h3>{t(`pricing.${key}.name`)}</h3>
                  <p className="price"><Bidi>{formatMoney(price, locale)}</Bidi></p>
                  <p className="payment-note">{t('pricing.once')}</p>
                  <ul>{(['one', 'two', 'three', 'four'] as const).map((feature) => (
                    <li key={feature}>{t(`pricing.${key}.features.${feature}`)}</li>
                  ))}</ul>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="section container faq" id="faq" aria-labelledby="faq-title">
          <p className="eyebrow">{t('faq.eyebrow')}</p>
          <h2 id="faq-title">{t('faq.title')}</h2>
          {(['languages', 'sharing', 'subscription'] as const).map((item) => (
            <details key={item}><summary>{t(`faq.${item}.question`)}</summary><p>{t(`faq.${item}.answer`)}</p></details>
          ))}
        </section>
      </main>
      <footer className="site-footer container">
        <div><a className="brand" href={`/${locale}`}>{t('brand')}</a><p>{t('footer.note')}</p></div>
        <nav aria-label={t('footer.label')}>
          {(['terms', 'privacy', 'refund'] as const).map((item) => (
            <a href="#legal-placeholder" key={item}>{t(`footer.${item}`)}</a>
          ))}
        </nav>
        <p className="legal-note" id="legal-placeholder">{t('footer.placeholder')}</p>
      </footer>
    </>
  );
}
