import type { Metadata } from 'next';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { listLiveTemplates } from '@/templates/registry';
import { TemplateCard } from '@/components/landing/TemplateCard';
import '@/styles/landing.css';

type Props = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  
  const t = await getTranslations({ locale, namespace: 'templates' });
  const tMeta = await getTranslations({ locale, namespace: 'metadata' });
  
  return {
    title: `${t('title')} | ${tMeta('title')}`,
    description: t('description'),
    alternates: {
      canonical: `/${locale}/templates`,
      languages: { ar: '/ar/templates', en: '/en/templates', 'x-default': '/ar/templates' }
    }
  };
}

export default async function TemplatesPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  
  const tLanding = await getTranslations('landing');
  const tTemplates = await getTranslations('templates');
  const liveTemplates = listLiveTemplates();

  return (
    <>
      <header className="site-header container">
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link className="brand" href="/">{tLanding('brand')}</Link>
          <nav className="main-nav" aria-label="Primary">
            <Link href="/templates" style={{ fontWeight: 600 }}>{tLanding('nav.templates')}</Link>
            <Link href="/#pricing">{tLanding('nav.pricing')}</Link>
            <Link href="/#faq">{tLanding('nav.faq')}</Link>
            <Link href="/app" style={{ color: 'var(--muted)' }}>{tLanding('nav.dashboard')}</Link>
          </nav>
        </div>
        <LanguageSwitcher />
      </header>
      
      <main id="main">
        <section className="section container">
          <div style={{ textAlign: 'center', marginBlockEnd: '3rem' }}>
            <h1>{tTemplates('title')}</h1>
            <p className="hero-description" style={{ marginInline: 'auto' }}>
              {tTemplates('description')}
            </p>
          </div>
          
          <div className="grid">
            {liveTemplates.map((template) => (
              <TemplateCard key={template.entry.slug} template={template} />
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer container" style={{ marginBlockStart: '4rem' }}>
        <div>
          <Link className="brand" href="/">{tLanding('brand')}</Link>
          <p>{tLanding('footer.note')}</p>
        </div>
        <nav aria-label={tLanding('footer.label')}>
          {(['terms', 'privacy', 'refund'] as const).map((item) => (
            <a href="#legal-placeholder" key={item}>{tLanding(`footer.${item}`)}</a>
          ))}
        </nav>
        <p className="legal-note" id="legal-placeholder">{tLanding('footer.placeholder')}</p>
      </footer>
    </>
  );
}
