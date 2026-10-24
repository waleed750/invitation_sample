'use client';

import {useId} from 'react';
import {useTranslations} from 'next-intl';
import {THEME_PRESETS, type InvitationDocument} from '@platform/shared';
import {applyDetails, readDetails, type CoupleDetails} from './couple';

interface Props {
  document: InvitationDocument;
  locale: 'ar' | 'en';
  onChange: (next: InvitationDocument, coalesceKey?: string) => void;
}

/** Names and date: the details every invitation has, edited once and applied everywhere they appear. */
export function DetailsPanel({document: doc, locale, onChange}: Props) {
  const t = useTranslations('editor');
  const id = useId();
  const details = readDetails(doc, locale);
  const set = (patch: CoupleDetails, key: string) => onChange(applyDetails(doc, patch, locale), key);
  return (
    <section className="ed-panel" aria-labelledby={`${id}-t`} data-testid="details-panel">
      <h3 id={`${id}-t`}>{t('detailsTitle')}</h3>
      <label className="ed-field">
        <span className="ed-label">{t('firstName')}</span>
        <input name="first" type="text" dir="auto" value={details.first} onChange={(event) => set({first: event.target.value}, 'details.first')} />
      </label>
      <label className="ed-field">
        <span className="ed-label">{t('secondName')}</span>
        <input name="second" type="text" dir="auto" value={details.second} onChange={(event) => set({second: event.target.value}, 'details.second')} />
      </label>
      <label className="ed-field">
        <span className="ed-label">{t('eventDate')}</span>
        <input name="date" type="date" dir="ltr" value={details.date} onChange={(event) => set({date: event.target.value}, 'details.date')} />
      </label>
    </section>
  );
}

interface ThemeProps {
  document: InvitationDocument;
  locale: 'ar' | 'en';
  onApply: (presetId: string) => void;
}

/** Theme presets: one tap changes colours and fonts. */
export function ThemePanel({document: doc, locale, onApply}: ThemeProps) {
  const t = useTranslations('editor');
  return (
    <section className="ed-panel" aria-labelledby="ed-theme-title" data-testid="theme-panel">
      <h3 id="ed-theme-title">{t('themeTitle')}</h3>
      <ul className="ed-themes">
        {THEME_PRESETS.map((preset) => (
          <li key={preset.id}>
            <button type="button" aria-pressed={doc.theme.presetId === preset.id} data-testid={`theme-${preset.id}`} onClick={() => onApply(preset.id)}>
              <span className="ed-swatches" aria-hidden="true">
                {[preset.colors.background, preset.colors.foreground, preset.colors.muted, preset.colors.ivory].map((color) => <i key={color} style={{background: color}} />)}
              </span>
              <span>{preset.name[locale]}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
