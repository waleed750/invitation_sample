import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { listLiveTemplates } from '@/templates/registry';
import { PhoneMockup } from '@/components/landing/PhoneMockup';
import { TemplateCard } from '@/components/landing/TemplateCard';
import { PricingCards } from '@/components/landing/PricingCards';
import '@/styles/landing.css';

export default async function Landing({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations('landing');
  const liveTemplates = listLiveTemplates();
  const featuredSlug = liveTemplates.find(t => t.entry.featured)?.entry.slug ?? liveTemplates[0]?.entry.slug ?? 'mashrabiya';

  return (
    <>
      <a className="skip-link" href="#main">{t('skip')}</a>
      <header className="site-header container">
        <div className="header-top">
          <Link className="brand" href="/">{t('brand')}</Link>
          <LanguageSwitcher />
        </div>
        <nav className="main-nav" aria-label="Primary">
          <Link href="/templates">{t('nav.templates')}</Link>
          <a href="#pricing">{t('nav.pricing')}</a>
          <a href="#faq">{t('nav.faq')}</a>
          <Link href="/app" style={{ color: 'var(--muted)' }}>{t('nav.dashboard')}</Link>
        </nav>
      </header>
      <main id="main">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-content">
            <div>
              <p className="eyebrow">{t('hero.eyebrow')}</p>
              <h1 id="hero-title">{t('hero.title')}</h1>
              <p className="hero-description" style={{ marginBlockEnd: '1.5rem', fontWeight: 500, color: 'var(--text)' }}>
                {t('hero.promise')}
              </p>
              <p className="hero-description">{t('hero.description')}</p>
              <div className="hero-ctas">
                <Link className="button" href={`/checkout/${featuredSlug}?tier=classic`}>{t('hero.ctaTry')}</Link>
                <Link className="button-outline" href={`/templates/${featuredSlug}`}>{t('hero.ctaDemo')}</Link>
              </div>
              <p className="hero-note" style={{ marginBlockStart: '1rem' }}>{t('hero.note')}</p>
            </div>
            <PhoneMockup />
          </div>
        </section>

        <section className="section container" id="how" aria-labelledby="how-title">
          <p className="eyebrow">{t('how.eyebrow')}</p>
          <h2 id="how-title">{t('how.title')}</h2>
          <ol className="steps grid">
            {(['pick', 'personalize', 'share'] as const).map((step) => (
              <li key={step} className="step">
                <span className="step-number" aria-hidden="true">{t(`how.${step}.number`)}</span>
                <h3>{t(`how.${step}.title`)}</h3>
                <p>{t(`how.${step}.description`)}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section container" id="templates" aria-labelledby="templates-title">
          <h2 id="templates-title">{t('nav.templates')}</h2>
          <div className="grid">
            {liveTemplates.map((template) => (
              <TemplateCard key={template.entry.slug} template={template} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginBlockStart: '2rem' }}>
            <Link href="/templates" className="button-outline">
              {t('nav.templates')} &rarr;
            </Link>
          </div>
        </section>

        <PricingCards />

        <section className="strip why">
          <div className="container">
            <h2>{t('why.title')}</h2>
            <div className="grid">
              {(['flat', 'preview', 'rsvp', 'noAccounts'] as const).map(feat => (
                <div key={feat}>
                  <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{t(`why.features.${feat}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="strip">
          <div className="container">
            <h2>{t('payments.title')}</h2>
            <div className="payments-grid">
              {(['card', 'wallet', 'fawry'] as const).map(method => (
                <div className="payment-method" key={method}>
                  <span style={{ fontWeight: 600 }}>{t(`payments.methods.${method}`)}</span>
                  <span className="soon">{t('payments.soon')}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section container faq" id="faq" aria-labelledby="faq-title">
          <p className="eyebrow">{t('faq.eyebrow')}</p>
          <h2 id="faq-title">{t('faq.title')}</h2>
          {(['languages', 'sharing', 'subscription', 'refund', 'edits', 'after'] as const).map((item) => (
            <details key={item}>
              <summary>{t(`faq.${item}.question`)}</summary>
              <p>{t(`faq.${item}.answer`)}</p>
            </details>
          ))}
        </section>
      </main>

      <footer className="site-footer container">
        <div>
          <Link className="brand" href="/">{t('brand')}</Link>
          <p>{t('footer.note')}</p>
        </div>
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
