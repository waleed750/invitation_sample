import type {Metadata} from 'next';
import {hasLocale} from 'next-intl';
import {setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import {isPubliclyListed, resolveText} from '@platform/shared';
import {getTemplate, listLiveTemplates} from '@/templates/registry';
import InvitationShell from '@/engine/InvitationShell';
import '@/engine/styles/templates/mashrabiya.css';
import '@/engine/styles/templates/diwan.css';

type Props = {params: Promise<{locale: string; slug: string}>};

export const dynamicParams = false;

export function generateStaticParams() {
  const live = listLiveTemplates();
  return routing.locales.flatMap((locale) =>
    live.map((item) => ({
      locale,
      slug: item.entry.slug,
    }))
  );
}

export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {locale, slug} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const template = getTemplate(slug);
  if (!template || !isPubliclyListed(template.entry)) notFound();
  const data = template.getData();
  const title = `${resolveText(data.couple.firstName, locale)} & ${resolveText(data.couple.secondName, locale)} — ${resolveText(data.couple.headline ?? '', locale)}`;
  const description = resolveText(data.copy.welcome ?? '', locale);

  return {
    title,
    description,
    robots: {index: false, follow: false},
    alternates: {
      canonical: `/${locale}/templates/${slug}`,
      languages: {
        ar: `/ar/templates/${slug}`,
        en: `/en/templates/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      locale: locale === 'ar' ? 'ar_EG' : 'en_GB',
      type: 'website',
    },
  };
}

export default async function TemplatePage({params}: Props) {
  const {locale, slug} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const template = getTemplate(slug);
  if (!template || !isPubliclyListed(template.entry)) notFound();
  const data = template.getData();

  return (
    <div className={template.fontClassName}>
      <InvitationShell data={data} locale={locale} templateSlug={slug} />
    </div>
  );
}
