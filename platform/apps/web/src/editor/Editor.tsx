'use client';

import {useCallback, useEffect, useMemo, useReducer, useState} from 'react';
import {useTranslations} from 'next-intl';
import {findThemePreset, type InvitationDocument, type SectionType} from '@platform/shared';
import {Link} from '@/i18n/navigation';
import {useAutosave} from './autosave';
import {AddSectionDialog} from './AddSectionDialog';
import {DetailsPanel, ThemePanel} from './DetailsPanel';
import {EasyMode} from './EasyMode';
import {FieldEditor} from './FieldEditor';
import {Onboarding} from './Onboarding';
import {Outline} from './Outline';
import {Preview, loadDevice, type Device} from './Preview';
import {PublishBar} from './PublishBar';
import {fieldsFor, type MediaKind} from './schema-fields';
import {SECTION_CATALOG} from './section-catalog';
import {canRedo, canUndo, initialState, reducer} from './state';

export interface EditorProps {
  invitationId: string;
  templateSlug: string;
  locale: 'ar' | 'en';
  initialDocument: InvitationDocument;
  version: string;
  allowedTypes: SectionType[];
  maxSections: number;
  remaining: number;
  expired: boolean;
  published: boolean;
  slug: string;
  canMusic: boolean;
  canVideo: boolean;
}

type Panel = 'details' | 'theme' | null;

export function Editor(props: EditorProps) {
  const {invitationId, templateSlug, locale, initialDocument, version, allowedTypes, maxSections, expired, canMusic, canVideo} = props;
  const t = useTranslations('editor');
  const [state, dispatch] = useReducer(reducer, undefined, () => initialState(initialDocument, version));
  const {saveNow} = useAutosave(state, dispatch, invitationId);
  const [mode, setMode] = useState<'easy' | 'advanced'>('easy');
  const [panel, setPanel] = useState<Panel>(null);
  const [adding, setAdding] = useState(false);
  const [mobileTab, setMobileTab] = useState<'preview' | 'sections'>('preview');
  const [device, setDevice] = useState<Device>('mobile');
  const [landscape, setLandscape] = useState(false);
  const [previewLocale, setPreviewLocale] = useState<'ar' | 'en'>(locale);
  const [remaining, setRemaining] = useState(props.remaining);
  const [published, setPublished] = useState(props.published);

  useEffect(() => {
    const saved = loadDevice();
    setDevice(saved.device);
    setLandscape(saved.landscape);
  }, []);

  // Ctrl/Cmd+Z, Shift+Ctrl/Cmd+Z, Ctrl+Y.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === 'z') {
        event.preventDefault();
        dispatch({type: event.shiftKey ? 'redo' : 'undo'});
      } else if (key === 'y') {
        event.preventDefault();
        dispatch({type: 'redo'});
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const doc = state.doc;
  const selected = doc.sections.find((section) => section.id === state.selectedId) ?? null;
  const eventType = doc.meta.template.eventType;
  const atLimit = doc.sections.length >= maxSections;
  const canUse = useCallback((kind: MediaKind) => (kind === 'video' ? canVideo : kind === 'audio' ? canMusic : true), [canMusic, canVideo]);
  const visible = useMemo(() => doc.sections.filter((section) => !section.hidden), [doc.sections]);
  const focusIndex = selected === null || selected.hidden ? null : visible.findIndex((section) => section.id === selected.id);
  const edit = useCallback((next: InvitationDocument, coalesceKey?: string) => dispatch({type: 'edit', doc: next, ...(coalesceKey === undefined ? {} : {coalesceKey})}), []);

  const select = (id: string) => {
    setPanel(null);
    dispatch({type: 'select', id});
  };

  const publishBar = (
    <PublishBar
      invitationId={invitationId}
      remaining={remaining}
      expired={expired}
      published={published}
      slug={props.slug}
      saveNow={saveNow}
      blocked={state.status === 'conflict'}
      onPublished={(left) => {
        setRemaining(left);
        setPublished(true);
      }}
    />
  );

  const statusLabel = t(`status.${state.status}`);

  const inspector = (
    <div className="ed-inspector" data-open={selected !== null || panel !== null} data-testid="inspector">
      {(selected !== null || panel !== null) && (
        <button type="button" className="ed-sheet-close" onClick={() => { setPanel(null); dispatch({type: 'select', id: null}); }}>{t('close')}</button>
      )}
      {selected !== null ? (
        <>
          <h3>{SECTION_CATALOG[selected.type].name[locale]}</h3>
          {selected.locked && <p className="ed-note">{t('lockedNote')}</p>}
          <FieldEditor
            key={selected.id}
            sectionType={selected.type}
            fields={fieldsFor(selected.type)}
            value={selected.props}
            invitationId={invitationId}
            canUse={canUse}
            onChange={(props, key) => edit({...doc, sections: doc.sections.map((section) => (section.id === selected.id ? {...section, props} : section))}, key)}
          />
        </>
      ) : panel === 'theme' ? (
        <ThemePanel document={doc} locale={locale} onApply={(id) => {
          const preset = findThemePreset(id);
          if (preset) dispatch({type: 'applyTheme', preset});
        }} />
      ) : (
        <DetailsPanel document={doc} locale={locale} onChange={edit} />
      )}
    </div>
  );

  if (mode === 'easy') {
    return (
      <div className="ed-shell" data-mode="easy" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <Onboarding />
        <EditorHeader {...{t, statusLabel, state, dispatch, mode, setMode, locale, previewLocale, setPreviewLocale}} />
        <ConflictBanner status={state.status} />
        <div className="ed-body ed-body--easy">
          <div className="ed-easy-col">
            <EasyMode document={doc} locale={locale} invitationId={invitationId} canMusic={canMusic} onChange={edit} publishSlot={publishBar} onLeave={() => setMode('advanced')} />
          </div>
          <div className="ed-preview-col" data-active>
            <Preview document={doc} templateSlug={templateSlug} locale={previewLocale} focusIndex={null} device={device} landscape={landscape} onDevice={(d, l) => { setDevice(d); setLandscape(l); }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ed-shell" data-mode="advanced" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Onboarding />
      <EditorHeader {...{t, statusLabel, state, dispatch, mode, setMode, locale, previewLocale, setPreviewLocale}} publish={publishBar} />
      <ConflictBanner status={state.status} />
      {state.errorCode && <p className="ed-error" role="alert">{t.has(`errors.${state.errorCode}`) ? t(`errors.${state.errorCode}`) : t('errors.invalid')}</p>}
      <nav className="ed-tabs" aria-label={t('views')}>
        <button type="button" aria-pressed={mobileTab === 'preview'} onClick={() => setMobileTab('preview')}>{t('tabPreview')}</button>
        <button type="button" aria-pressed={mobileTab === 'sections'} onClick={() => setMobileTab('sections')}>{t('tabSections')}</button>
      </nav>
      <div className="ed-body" data-tab={mobileTab}>
        <aside className="ed-outline-col" aria-label={t('sections')}>
          <div className="ed-quick">
            <button type="button" aria-pressed={panel === 'details' && selected === null} onClick={() => { dispatch({type: 'select', id: null}); setPanel('details'); }}>{t('detailsTitle')}</button>
            <button type="button" aria-pressed={panel === 'theme' && selected === null} data-testid="open-theme" onClick={() => { dispatch({type: 'select', id: null}); setPanel('theme'); }}>{t('themeTitle')}</button>
          </div>
          {doc.sections.length === 0 ? (
            <div className="ed-empty" data-testid="empty-state">
              <h3>{t('emptyTitle')}</h3>
              <p>{t('emptyBody')}</p>
            </div>
          ) : (
            <Outline
              sections={doc.sections}
              selectedId={state.selectedId}
              locale={locale}
              onSelect={select}
              onMove={(id, to) => dispatch({type: 'moveSection', id, toIndex: to})}
              onToggleHidden={(id) => dispatch({type: 'toggleHidden', id})}
              onDuplicate={(id) => dispatch({type: 'duplicateSection', id})}
              onRemove={(id) => dispatch({type: 'removeSection', id})}
            />
          )}
          <button type="button" className="ed-btn ed-btn--primary ed-add" data-testid="add-section" onClick={() => setAdding(true)}>{t('addSection')}</button>
        </aside>
        <div className="ed-preview-col" data-active={mobileTab === 'preview'}>
          <Preview document={doc} templateSlug={templateSlug} locale={previewLocale} focusIndex={focusIndex} device={device} landscape={landscape} onDevice={(d, l) => { setDevice(d); setLandscape(l); }} />
        </div>
        {inspector}
      </div>
      <AddSectionDialog
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(type) => {
          setMobileTab('sections');
          dispatch({type: 'addSection', section: {type, props: SECTION_CATALOG[type].create()}, index: doc.sections.length});
        }}
        eventType={eventType}
        allowedTypes={allowedTypes}
        atLimit={atLimit}
        locale={locale}
      />
      <Link className="ed-back" href="/app">{t('back')}</Link>
    </div>
  );
}

function ConflictBanner({status}: {status: string}) {
  const t = useTranslations('editor');
  if (status !== 'conflict') return null;
  return (
    <div className="ed-conflict" role="alert" data-testid="conflict">
      <p>{t('conflict')}</p>
      <button type="button" className="ed-btn ed-btn--primary" onClick={() => window.location.reload()}>{t('reload')}</button>
    </div>
  );
}

function EditorHeader({t, statusLabel, state, dispatch, mode, setMode, publish, previewLocale, setPreviewLocale}: {
  t: ReturnType<typeof useTranslations>; statusLabel: string; state: ReturnType<typeof initialState>; dispatch: React.Dispatch<Parameters<typeof reducer>[1]>;
  mode: 'easy' | 'advanced'; setMode: (mode: 'easy' | 'advanced') => void; locale: 'ar' | 'en'; previewLocale: 'ar' | 'en'; setPreviewLocale: (l: 'ar' | 'en') => void;
  publish?: React.ReactNode;
}) {
  return (
    <header className="ed-header">
      <div className="ed-header__left">
        <Link className="ed-link" href="/app">{t('back')}</Link>
        <span className={`ed-status is-${state.status}`} role="status" aria-live="polite" data-testid="save-status" data-status={state.status}>{statusLabel}</span>
      </div>
      <div className="ed-header__tools">
        <button type="button" aria-label={t('undo')} data-testid="undo" disabled={!canUndo(state)} onClick={() => dispatch({type: 'undo'})}>↶</button>
        <button type="button" aria-label={t('redo')} data-testid="redo" disabled={!canRedo(state)} onClick={() => dispatch({type: 'redo'})}>↷</button>
        <div className="ed-seg" role="group" aria-label={t('mode')}>
          <button type="button" aria-pressed={mode === 'easy'} data-testid="mode-easy" onClick={() => setMode('easy')}>{t('modeEasy')}</button>
          <button type="button" aria-pressed={mode === 'advanced'} data-testid="mode-advanced" onClick={() => setMode('advanced')}>{t('modeAdvanced')}</button>
        </div>
        <div className="ed-seg" role="group" aria-label={t('previewLanguage')}>
          <button type="button" aria-pressed={previewLocale === 'ar'} data-testid="preview-ar" onClick={() => setPreviewLocale('ar')}>{t('langAr')}</button>
          <button type="button" aria-pressed={previewLocale === 'en'} data-testid="preview-en" onClick={() => setPreviewLocale('en')}>{t('langEn')}</button>
        </div>
      </div>
      {publish}
    </header>
  );
}
