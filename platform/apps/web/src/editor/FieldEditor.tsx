'use client';

import {useId, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {LocalizedText} from '@platform/shared';
import {MediaPicker} from '@/media/MediaPicker';
import type {MediaItem} from '@/media/api';
import {readLocalized, setLocalized} from './couple';
import {inTokenMode} from './api';
import {emptyFor, setAt, type Field, type ListItem, type MediaKind} from './schema-fields';
import {suggestionsFor} from './suggestions';

type Locale = 'ar' | 'en';
type Props = {
  sectionType: string;
  fields: Field[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>, coalesceKey?: string) => void;
  /** Gate for media kinds the plan does not include (video, music). */
  canUse: (kind: MediaKind) => boolean;
  invitationId: string;
};

const MULTILINE = /^(body|prose|description|answer|message|text|intro|note|welcome|content)/i;

function humanize(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}

/** Edits one section's props with a form generated from its schema (see schema-fields.ts). */
export function FieldEditor({sectionType, fields, value, onChange, canUse, invitationId}: Props) {
  return (
    <div className="ed-fields">
      {fields.map((field) => (
        <FieldRow
          key={field.key}
          field={field}
          path={`${sectionType}.${field.key}`}
          sectionType={sectionType}
          value={value[field.key]}
          onChange={(next, key) => onChange(setAt(value, field.key, next), key)}
          canUse={canUse}
          invitationId={invitationId}
        />
      ))}
    </div>
  );
}

interface RowProps {
  field: Field;
  path: string;
  sectionType: string;
  value: unknown;
  onChange: (next: unknown, coalesceKey?: string) => void;
  canUse: (kind: MediaKind) => boolean;
  invitationId: string;
}

function useLabel() {
  const t = useTranslations('editor');
  return (key: string): string => (t.has(`fields.${key}`) ? t(`fields.${key}`) : humanize(key));
}

function FieldRow(props: RowProps) {
  const {field, value, onChange} = props;
  const t = useTranslations('editor');
  const label = useLabel();
  const id = useId();
  const title = label(field.key);

  switch (field.kind) {
    case 'text':
      return <LocalizedTextField {...props} field={field} title={title} />;
    case 'string':
      return <StringField {...props} field={field} title={title} />;
    case 'boolean':
      return (
        <label className="ed-check">
          <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />
          <span>{title}</span>
        </label>
      );
    case 'number':
      return (
        <label className="ed-field" htmlFor={id}>
          <span className="ed-label">{title}</span>
          <input id={id} type="number" dir="ltr" value={typeof value === 'number' ? value : ''} onChange={(event) => onChange(event.target.value === '' ? (field.optional ? undefined : 0) : Number(event.target.value))} />
        </label>
      );
    case 'enum':
      return (
        <label className="ed-field" htmlFor={id}>
          <span className="ed-label">{title}</span>
          <select id={id} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value === '' ? undefined : event.target.value)}>
            {field.optional && <option value="">{t('none')}</option>}
            {field.options.map((option) => <option key={option} value={option}>{t.has(`options.${option}`) ? t(`options.${option}`) : option}</option>)}
          </select>
        </label>
      );
    case 'group':
      return (
        <fieldset className="ed-group">
          <legend>{title}</legend>
          <FieldEditor
            sectionType={props.path}
            fields={field.fields}
            value={isRecord(value) ? value : {}}
            onChange={(next, key) => onChange(next, key)}
            canUse={props.canUse}
            invitationId={props.invitationId}
          />
        </fieldset>
      );
    case 'list':
      return <ListField {...props} field={field} title={title} />;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function useUiLocale(): Locale {
  const t = useTranslations('editor');
  return t('dir') === 'rtl' ? 'ar' : 'en';
}

function LocalizedTextField({field, title, value, onChange, sectionType, path}: RowProps & {field: Extract<Field, {kind: 'text'}>; title: string}) {
  const t = useTranslations('editor');
  const uiLocale = useUiLocale();
  const base = useId();
  const current = value as LocalizedText | undefined;
  const multiline = MULTILINE.test(field.key);
  const suggestions = suggestionsFor(sectionType.split('.')[0] ?? sectionType, field.key);

  const write = (locale: Locale, text: string) => {
    const next = setLocalized(current, locale, text);
    const empty = typeof next !== 'string' && (next.ar ?? '') === '' && (next.en ?? '') === '';
    onChange(empty && field.optional ? undefined : next, `${path}.${locale}`);
  };

  const order: Locale[] = uiLocale === 'ar' ? ['ar', 'en'] : ['en', 'ar'];
  return (
    <div className="ed-field ed-bilingual" data-field={path}>
      <span className="ed-label">{title}</span>
      <div className="ed-pair">
        {order.map((locale) => {
          const Input = multiline ? 'textarea' : 'input';
          return (
            <label key={locale} className="ed-lang" htmlFor={`${base}-${locale}`}>
              <span className="ed-lang__tag">{locale === 'ar' ? t('langAr') : t('langEn')}</span>
              <Input
                id={`${base}-${locale}`}
                lang={locale}
                dir={locale === 'ar' ? 'rtl' : 'ltr'}
                {...(multiline ? {rows: 3} : {type: 'text'})}
                name={`${path}.${locale}`}
                value={readLocalized(current, locale)}
                onChange={(event) => write(locale, event.target.value)}
              />
            </label>
          );
        })}
      </div>
      {suggestions.length > 0 && (
        <details className="ed-suggest">
          <summary>{t('suggestions')}</summary>
          <ul>
            {suggestions.map((suggestion) => (
              <li key={suggestion.ar}>
                <button type="button" onClick={() => onChange({ar: suggestion.ar, en: suggestion.en})}>
                  {uiLocale === 'ar' ? suggestion.ar : suggestion.en}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function StringField({field, title, value, onChange, canUse}: RowProps & {field: Extract<Field, {kind: 'string'}>; title: string}) {
  const t = useTranslations('editor');
  const id = useId();
  const [picking, setPicking] = useState(false);
  const text = typeof value === 'string' ? value : '';

  if (field.format === 'datetime') return <DateTimeField title={title} value={text} onChange={(next) => onChange(next === '' && field.optional ? undefined : next)} />;

  if (field.media !== null) {
    const allowed = canUse(field.media);
    return (
      <div className="ed-field ed-media" data-field={field.key}>
        <span className="ed-label">{title}</span>
        {text !== '' && field.media === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="ed-media__thumb" src={text} alt="" />
        )}
        {text !== '' && field.media !== 'image' && <p className="ed-media__file" dir="ltr">{text.split('/').pop()}</p>}
        <div className="ed-media__actions">
          {inTokenMode() ? (
            <span className="ed-note" data-testid="token-media-note">{t('privateLink.noMedia')}</span>
          ) : allowed ? (
            <button type="button" className="ed-btn" onClick={() => setPicking(true)}>{text === '' ? t('chooseFile') : t('changeFile')}</button>
          ) : (
            <span className="ed-note">{t('notInPlan')}</span>
          )}
          {text !== '' && <button type="button" className="ed-link" onClick={() => onChange(undefined)}>{t('clear')}</button>}
        </div>
        <MediaPicker open={picking} onClose={() => setPicking(false)} kind={field.media} onSelect={(item: MediaItem) => onChange(bestUrl(item))} />
      </div>
    );
  }

  return (
    <label className="ed-field" htmlFor={id}>
      <span className="ed-label">{title}</span>
      <input
        id={id}
        type={field.format === 'color' ? 'color' : 'text'}
        dir={field.format === 'url' ? 'ltr' : 'auto'}
        inputMode={field.format === 'url' ? 'url' : undefined}
        name={field.key}
        value={text}
        onChange={(event) => onChange(event.target.value === '' && field.optional ? undefined : event.target.value, `field.${field.key}`)}
      />
    </label>
  );
}

/** The largest generated size of a photo, or the file itself for video and music. */
export function bestUrl(item: MediaItem): string {
  if (item.kind === 'image' && item.variants.length > 0) return item.variants[item.variants.length - 1]?.url ?? item.url ?? '';
  return item.url ?? '';
}

function DateTimeField({title, value, onChange}: {title: string; value: string; onChange: (next: string) => void}) {
  const id = useId();
  const [date = '', time = ''] = value.length >= 16 ? [value.slice(0, 10), value.slice(11, 16)] : ['', ''];
  const write = (nextDate: string, nextTime: string) => onChange(nextDate === '' ? '' : `${nextDate}T${nextTime === '' ? '19:30' : nextTime}:00+02:00`);
  return (
    <div className="ed-field">
      <span className="ed-label">{title}</span>
      <div className="ed-pair">
        <input id={`${id}-d`} type="date" dir="ltr" value={date} onChange={(event) => write(event.target.value, time)} />
        <input id={`${id}-t`} type="time" dir="ltr" value={time} onChange={(event) => write(date, event.target.value)} />
      </div>
    </div>
  );
}

function ListField({field, title, value, onChange, sectionType, path, canUse, invitationId}: RowProps & {field: Extract<Field, {kind: 'list'}>; title: string}) {
  const t = useTranslations('editor');
  const label = useLabel();
  const items = Array.isArray(value) ? (value as unknown[]) : [];
  const set = (next: unknown[], key?: string) => onChange(next.length === 0 && field.optional ? undefined : next, key);
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [taken] = next.splice(from, 1);
    next.splice(to, 0, taken);
    set(next);
  };
  return (
    <fieldset className="ed-group ed-list" data-field={path}>
      <legend>{title}</legend>
      {items.length === 0 && <p className="ed-note">{t('listEmpty')}</p>}
      {items.map((item, index) => (
        <div className="ed-list__item" key={index}>
          <div className="ed-list__body">
            <ListItemEditor
              item={field.item}
              value={item}
              index={index}
              label={label(field.key)}
              onChange={(next, key) => set(items.map((existing, at) => (at === index ? next : existing)), key)}
              sectionType={sectionType}
              path={`${path}.${String(index)}`}
              canUse={canUse}
              invitationId={invitationId}
            />
          </div>
          <div className="ed-list__tools" role="group" aria-label={t('itemTools')}>
            <button type="button" aria-label={t('moveUp')} disabled={index === 0} onClick={() => move(index, index - 1)}>↑</button>
            <button type="button" aria-label={t('moveDown')} disabled={index === items.length - 1} onClick={() => move(index, index + 1)}>↓</button>
            <button type="button" aria-label={t('remove')} onClick={() => set(items.filter((_, at) => at !== index))}>✕</button>
          </div>
        </div>
      ))}
      <button type="button" className="ed-btn" onClick={() => set([...items, emptyFor(field.item as ListItem as never)])}>{t('addItem')}</button>
    </fieldset>
  );
}

function ListItemEditor({item, value, onChange, sectionType, path, canUse, invitationId, label, index}: {
  item: ListItem; value: unknown; onChange: (next: unknown, key?: string) => void; sectionType: string; path: string;
  canUse: (kind: MediaKind) => boolean; invitationId: string; label: string; index: number;
}) {
  const fieldFor: Field | null = item.kind === 'text'
    ? {kind: 'text', key: label, optional: false}
    : item.kind === 'string'
      ? {kind: 'string', key: label, optional: false, format: 'plain', media: item.media}
      : null;
  if (item.kind === 'group') {
    return (
      <FieldEditor sectionType={path} fields={item.fields} value={isRecord(value) ? value : {}} onChange={(next, key) => onChange(next, key)} canUse={canUse} invitationId={invitationId} />
    );
  }
  if (fieldFor === null) return null;
  const rowValue = typeof value === 'string' || isRecord(value) ? value : undefined;
  return (
    <FieldRow
      field={{...fieldFor, key: `${label} ${String(index + 1)}`}}
      path={path}
      sectionType={sectionType}
      value={item.kind === 'string' && isRecord(rowValue) ? (rowValue as {src?: string}).src ?? '' : rowValue}
      onChange={(next, key) => onChange(next, key)}
      canUse={canUse}
      invitationId={invitationId}
    />
  );
}
