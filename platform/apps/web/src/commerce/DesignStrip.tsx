import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import {IconCalendar, IconStar} from './icons';

interface DesignStripProps {
  templateName: string;
  first: string;
  second: string;
  dateText: string;
}

export function DesignStrip({
  templateName,
  first,
  second,
  dateText,
}: DesignStripProps) {
  const t = useTranslations('checkout');

  const namesDisplay = first.trim() && second.trim()
    ? `${first.trim()} & ${second.trim()}`
    : first.trim() || second.trim() || `${t('details.firstPlaceholder')} & ${t('details.secondPlaceholder')}`;

  return (
    <section className="design-strip" aria-label={templateName}>
      <div className="design-strip__inner">
        <div className="design-strip__thumb" aria-hidden="true">
          <div className="design-strip__arch">
            <IconStar size={20} className="design-strip__arch-mark" />
            <span className="design-strip__arch-label">{templateName.slice(0, 1)}</span>
          </div>
        </div>

        <div className="design-strip__content">
          <div className="design-strip__top">
            <span className="design-strip__kicker">{templateName}</span>
            <Link href="/templates" className="design-strip__change">
              {t('details.changeTemplate')}
            </Link>
          </div>

          <p className="design-strip__names" aria-live="polite">
            {namesDisplay}
          </p>

          <p className="design-strip__date">
            <IconCalendar size={14} />
            <span>{dateText || t('details.datePlaceholder')}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
