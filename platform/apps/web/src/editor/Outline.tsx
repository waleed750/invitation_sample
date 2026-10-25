'use client';

import {useRef, useState, type KeyboardEvent} from 'react';
import {useTranslations} from 'next-intl';
import type {DocumentSection, SectionType} from '@platform/shared';
import {SECTION_CATALOG} from './section-catalog';

interface Props {
  sections: DocumentSection[];
  selectedId: string | null;
  locale: 'ar' | 'en';
  onSelect: (id: string) => void;
  onMove: (id: string, toIndex: number) => void;
  onToggleHidden: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
}

/**
 * The list of sections. Reorder by dragging, with the up/down buttons (touch), or with Alt+Arrow on the keyboard.
 */
export function Outline({sections, selectedId, locale, onSelect, onMove, onToggleHidden, onDuplicate, onRemove}: Props) {
  const t = useTranslations('editor');
  const [dragging, setDragging] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const rows = useRef<Map<string, HTMLLIElement>>(new Map());

  const nameOf = (type: SectionType) => SECTION_CATALOG[type].name[locale];

  function move(id: string, to: number) {
    onMove(id, to);
    setAnnounce(t('movedTo', {position: to + 1, total: sections.length}));
    // keep keyboard focus on the moved row after React reorders it
    window.requestAnimationFrame(() => rows.current.get(id)?.focus());
  }

  function onKeyDown(event: KeyboardEvent<HTMLLIElement>, section: DocumentSection, index: number) {
    if (event.target !== event.currentTarget) return;
    if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      event.preventDefault();
      const to = event.key === 'ArrowUp' ? index - 1 : index + 1;
      if (to >= 0 && to < sections.length && !section.locked) move(section.id, to);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(section.id);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const next = rows.current.get(sections[index + (event.key === 'ArrowUp' ? -1 : 1)]?.id ?? '');
      next?.focus();
    }
  }

  return (
    <div className="ed-outline">
      <p className="sr-only" role="status" aria-live="polite">{announce}</p>
      <ul role="listbox" aria-label={t('sections')} aria-describedby="ed-outline-help">
        {sections.map((section, index) => (
          <li
            key={section.id}
            ref={(element) => {
              if (element) rows.current.set(section.id, element);
              else rows.current.delete(section.id);
            }}
            role="option"
            aria-selected={selectedId === section.id}
            tabIndex={0}
            draggable={!section.locked}
            data-testid="outline-row"
            data-section-id={section.id}
            data-section-type={section.type}
            className={`ed-row${selectedId === section.id ? ' is-selected' : ''}${section.hidden ? ' is-hidden' : ''}${overIndex === index ? ' is-over' : ''}`}
            onClick={() => onSelect(section.id)}
            onKeyDown={(event) => onKeyDown(event, section, index)}
            onDragStart={(event) => {
              setDragging(section.id);
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', section.id);
            }}
            onDragOver={(event) => {
              if (dragging !== null) {
                event.preventDefault();
                setOverIndex(index);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragging !== null && dragging !== section.id) move(dragging, index);
              setDragging(null);
              setOverIndex(null);
            }}
            onDragEnd={() => {
              setDragging(null);
              setOverIndex(null);
            }}
          >
            <span className="ed-row__grip" aria-hidden="true">⋮⋮</span>
            <span className="ed-row__name">
              {nameOf(section.type)}
              {section.hidden && <em>{t('hiddenTag')}</em>}
              {section.locked && <em>{t('lockedTag')}</em>}
            </span>
            <span className="ed-row__tools" onClick={(event) => event.stopPropagation()}>
              <button type="button" aria-label={t('moveUp')} disabled={index === 0 || section.locked} onClick={() => move(section.id, index - 1)}>↑</button>
              <button type="button" aria-label={t('moveDown')} disabled={index === sections.length - 1 || section.locked} onClick={() => move(section.id, index + 1)}>↓</button>
              <button type="button" aria-label={section.hidden ? t('show') : t('hide')} aria-pressed={section.hidden} disabled={section.locked} onClick={() => onToggleHidden(section.id)}>{section.hidden ? '◌' : '●'}</button>
              <button type="button" aria-label={t('duplicate')} onClick={() => onDuplicate(section.id)}>⧉</button>
              {confirming === section.id ? (
                <>
                  <button type="button" className="is-danger" onClick={() => { onRemove(section.id); setConfirming(null); }}>{t('removeYes')}</button>
                  <button type="button" onClick={() => setConfirming(null)}>{t('removeNo')}</button>
                </>
              ) : (
                <button type="button" aria-label={t('remove')} disabled={section.locked} onClick={() => setConfirming(section.id)}>✕</button>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p id="ed-outline-help" className="ed-note">{t('outlineHelp')}</p>
    </div>
  );
}
