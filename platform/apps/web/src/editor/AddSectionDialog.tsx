'use client';

import {useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {SectionType} from '@platform/shared';
import {SECTION_CATALOG, recommendedFor} from './section-catalog';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (type: SectionType) => void;
  eventType: 'engagement' | 'save-the-date' | 'wedding' | 'birthday';
  allowedTypes: readonly SectionType[];
  atLimit: boolean;
  locale: 'ar' | 'en';
}

/** The picker: only what the plan allows, with suggestions for the event type marked "Recommended". */
export function AddSectionDialog({open, onClose, onAdd, eventType, allowedTypes, atLimit, locale}: Props) {
  const t = useTranslations('editor');
  const dialog = useRef<HTMLDialogElement>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const recommended = new Set(recommendedFor(eventType));
  const entries = (Object.keys(SECTION_CATALOG) as SectionType[])
    .filter((type) => allowedTypes.includes(type))
    .sort((a, b) => Number(recommended.has(b)) - Number(recommended.has(a)));
  const main = entries.filter((type) => !SECTION_CATALOG[type].advanced);
  const extra = entries.filter((type) => SECTION_CATALOG[type].advanced);
  const lockedByPlan = (Object.keys(SECTION_CATALOG) as SectionType[]).filter((type) => !allowedTypes.includes(type) && !SECTION_CATALOG[type].advanced);

  const row = (type: SectionType) => (
    <li key={type}>
      <button type="button" className="ed-pick" disabled={atLimit} data-testid="add-option" data-section-type={type} onClick={() => { onAdd(type); onClose(); }}>
        <strong>{SECTION_CATALOG[type].name[locale]}</strong>
        {recommended.has(type) && <span className="ed-badge">{t('recommended')}</span>}
        <small>{SECTION_CATALOG[type].hint[locale]}</small>
      </button>
    </li>
  );

  return (
    <dialog ref={dialog} className="ed-dialog" aria-labelledby="ed-add-title" onClose={onClose}>
      <header className="ed-dialog__head">
        <h2 id="ed-add-title">{t('addSection')}</h2>
        <button type="button" className="ed-link" onClick={onClose}>{t('close')}</button>
      </header>
      {atLimit && <p className="ed-error" role="alert">{t('sectionLimit')}</p>}
      <ul className="ed-picks">{main.map(row)}</ul>
      {extra.length > 0 && (
        <>
          <button type="button" className="ed-link" aria-expanded={more} onClick={() => setMore((value) => !value)}>{more ? t('lessSections') : t('moreSections')}</button>
          {more && <ul className="ed-picks">{extra.map(row)}</ul>}
        </>
      )}
      {lockedByPlan.length > 0 && (
        <p className="ed-note">{t('notInPlanSections', {names: lockedByPlan.map((type) => SECTION_CATALOG[type].name[locale]).join('، ')})}</p>
      )}
    </dialog>
  );
}
