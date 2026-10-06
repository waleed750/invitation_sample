import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Bidi } from '@/components/Bidi';
import { formatMoney, type FormatLocale } from '@/lib/format';
import { type TemplateDefinition } from '@/templates/registry';
import { priceFor } from '@platform/shared';
import { resolveText } from '@platform/shared';

export function TemplateCard({ template }: { template: TemplateDefinition }) {
  const locale = useLocale();
  const t = useTranslations('templates');
  const entry = template.entry;
  const name = resolveText(entry.name, locale as FormatLocale);
  const tagline = resolveText(entry.tagline, locale as FormatLocale);
  const price = priceFor(entry);

  return (
    <article className="template-card">
      <h3>{name}</h3>
      <p className="template-tagline">{tagline}</p>
      <div className="template-meta">
        <span className="template-tier-badge">{t('card.tier', { tier: entry.tier })}</span>
        <span className="template-price">
          {t('card.from')} <Bidi>{formatMoney(price, locale as FormatLocale)}</Bidi>
        </span>
      </div>
      <div className="template-actions">
        <Link href={`/templates/${entry.slug}`} className="button-outline">{t('card.demo')}</Link>
        <Link href={`/checkout/${entry.slug}?tier=${entry.tier}`} className="button">{t('card.use')}</Link>
      </div>
    </article>
  );
}
