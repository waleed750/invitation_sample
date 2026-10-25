import '@/styles/public.css';
import {getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {formatDate} from '@/lib/format';

/** Shown instead of a 404 once an invitation's online period is over. */
export async function EndedInvitation({first, second, eventDate, locale}: {first: string; second: string; eventDate: string; locale: 'ar' | 'en'}) {
  const t = await getTranslations('public.ended');
  const names = [first, second].filter((name) => name.trim() !== '').join(' & ');
  const parsed = eventDate ? new Date(eventDate) : null;
  const date = parsed && !Number.isNaN(parsed.getTime()) ? formatDate(parsed, locale) : eventDate;
  return (
    <main className="public-status-page" data-testid="invitation-ended">
      <div>
        <p className="eyebrow">{t('eyebrow')}</p>
        {names && <h1 dir="auto">{names}</h1>}
        {date && <p className="public-ended__date">{date}</p>}
        <p>{t('title')}</p>
        <p className="public-ended__lead">{t('lead')}</p>
        <Link className="button" href="/templates">{t('cta')}</Link>
      </div>
    </main>
  );
}
