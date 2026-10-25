import '@/styles/legal.css';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';

export type LegalDoc = 'terms' | 'privacy' | 'refund';
const SECTION_COUNT: Record<LegalDoc, number> = {terms: 8, privacy: 8, refund: 6};

/** One legal document, rendered from the `legal.<doc>` messages. The text is a draft until a lawyer signs it off. */
export async function LegalPage({doc}: {doc: LegalDoc}) {
  const t = await getTranslations('legal');
  const sections = Array.from({length: SECTION_COUNT[doc]}, (_, index) => `s${String(index + 1)}`);
  return (
    <main className="legal-page">
      <article>
        <p className="legal-draft" role="note" data-testid="legal-draft">{t('draftNotice')}</p>
        <h1>{t(`${doc}.title`)}</h1>
        <p className="legal-updated">{t('updated')}</p>
        <p>{t(`${doc}.intro`)}</p>
        {sections.map((key) => (
          <section key={key}>
            <h2>{t(`${doc}.${key}.title`)}</h2>
            <p>{t(`${doc}.${key}.body`)}</p>
          </section>
        ))}
        <nav className="legal-links" aria-label={t('moreLabel')}>
          {(['terms', 'privacy', 'refund'] as const).filter((other) => other !== doc).map((other) => (
            <Link key={other} href={`/${other}`}>{t(`${other}.title`)}</Link>
          ))}
          <Link href="/">{t('home')}</Link>
        </nav>
      </article>
    </main>
  );
}
