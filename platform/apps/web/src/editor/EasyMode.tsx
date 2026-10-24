'use client';

import {useState} from 'react';
import {useTranslations} from 'next-intl';
import type {InvitationDocument} from '@platform/shared';
import {MediaPicker} from '@/media/MediaPicker';
import type {MediaItem} from '@/media/api';
import {DetailsPanel} from './DetailsPanel';
import {bestUrl} from './FieldEditor';
import {readLocalized, setLocalized} from './couple';
import {SECTION_CATALOG} from './section-catalog';

const STEPS = ['names', 'date', 'photos', 'music', 'review'] as const;
type Step = (typeof STEPS)[number];

interface Props {
  document: InvitationDocument;
  locale: 'ar' | 'en';
  invitationId: string;
  canMusic: boolean;
  onChange: (next: InvitationDocument, coalesceKey?: string) => void;
  /** The review step's publish button. */
  publishSlot: React.ReactNode;
  onLeave: () => void;
}

/** Guided mode: names, date and venue, photos, music, review. Each step does one thing. */
export function EasyMode({document: doc, locale, invitationId, canMusic, onChange, publishSlot, onLeave}: Props) {
  const t = useTranslations('editor.easy');
  const te = useTranslations('editor');
  const [step, setStep] = useState<Step>('names');
  const [picking, setPicking] = useState<'photos' | 'music' | null>(null);
  const index = STEPS.indexOf(step);

  const details = doc.sections.find((section) => section.type === 'details');
  const gallery = doc.sections.find((section) => section.type === 'gallery');
  const images = Array.isArray(gallery?.props.images) ? (gallery?.props.images as unknown[]) : [];

  function setVenue(venue: string) {
    if (!details) return;
    onChange({...doc, sections: doc.sections.map((section) => (section.id === details.id ? {...section, props: {...section.props, venue: setLocalized(section.props.venue as never, locale, venue)}} : section))}, 'easy.venue');
  }
  function setMap(url: string) {
    if (!details) return;
    onChange({...doc, sections: doc.sections.map((section) => (section.id === details.id ? {...section, props: {...section.props, mapUrl: url}} : section))}, 'easy.map');
  }
  function addPhoto(item: MediaItem) {
    const url = bestUrl(item);
    if (gallery) {
      onChange({...doc, sections: doc.sections.map((section) => (section.id === gallery.id ? {...section, props: {...section.props, images: [...images, url]}} : section))});
    } else {
      onChange({...doc, sections: [...doc.sections, {id: `gallery-${String(doc.sections.length + 1)}`, type: 'gallery', variant: null, hidden: false, locked: false, props: {...SECTION_CATALOG.gallery.create(), images: [url]}}]});
    }
  }
  function setMusic(item: MediaItem | null) {
    const media = {...doc.meta.media};
    if (item === null) delete media.musicUrl;
    else media.musicUrl = item.url ?? undefined;
    onChange({...doc, meta: {...doc.meta, media}});
  }

  return (
    <section className="ed-easy" aria-labelledby="ed-easy-title" data-testid="easy-mode">
      <header>
        <h2 id="ed-easy-title">{t('title')}</h2>
        <ol className="ed-steps" aria-label={t('steps')}>
          {STEPS.map((name, at) => (
            <li key={name} aria-current={name === step ? 'step' : undefined} className={at < index ? 'is-done' : ''}>{t(`step.${name}`)}</li>
          ))}
        </ol>
      </header>

      {step === 'names' && <DetailsPanel document={doc} locale={locale} onChange={onChange} />}
      {step === 'date' && (
        <div className="ed-panel">
          <p>{t('dateLead')}</p>
          <DetailsPanel document={doc} locale={locale} onChange={onChange} />
          {details ? (
            <>
              <label className="ed-field"><span className="ed-label">{t('venue')}</span>
                <input name="venue" type="text" dir="auto" value={readLocalized(details.props.venue as never, locale)} onChange={(event) => setVenue(event.target.value)} />
              </label>
              <label className="ed-field"><span className="ed-label">{t('mapLink')}</span>
                <input name="mapUrl" type="text" dir="ltr" inputMode="url" value={typeof details.props.mapUrl === 'string' ? details.props.mapUrl : ''} onChange={(event) => setMap(event.target.value)} />
              </label>
            </>
          ) : <p className="ed-note">{t('noVenueSection')}</p>}
        </div>
      )}
      {step === 'photos' && (
        <div className="ed-panel">
          <p>{t('photosLead')}</p>
          <ul className="ed-thumbs">
            {images.map((image, at) => {
              const src = typeof image === 'string' ? image : (image as {src?: string}).src ?? '';
              return (
                <li key={`${src}-${String(at)}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" />
                  <button type="button" aria-label={te('remove')} onClick={() => gallery && onChange({...doc, sections: doc.sections.map((section) => (section.id === gallery.id ? {...section, props: {...section.props, images: images.filter((_, i) => i !== at)}} : section))})}>✕</button>
                </li>
              );
            })}
          </ul>
          <button type="button" className="ed-btn" onClick={() => setPicking('photos')}>{t('addPhoto')}</button>
        </div>
      )}
      {step === 'music' && (
        <div className="ed-panel">
          {canMusic ? (
            <>
              <p>{t('musicLead')}</p>
              {doc.meta.media.musicUrl ? <p dir="ltr">{doc.meta.media.musicUrl.split('/').pop()}</p> : <p className="ed-note">{t('noMusic')}</p>}
              <div className="ed-media__actions">
                <button type="button" className="ed-btn" onClick={() => setPicking('music')}>{doc.meta.media.musicUrl ? te('changeFile') : te('chooseFile')}</button>
                {doc.meta.media.musicUrl && <button type="button" className="ed-link" onClick={() => setMusic(null)}>{te('clear')}</button>}
              </div>
            </>
          ) : <p className="ed-note">{t('musicNotInPlan')}</p>}
        </div>
      )}
      {step === 'review' && (
        <div className="ed-panel">
          <p>{t('reviewLead')}</p>
          {publishSlot}
        </div>
      )}

      <footer className="ed-easy__nav">
        <button type="button" className="ed-link" onClick={onLeave}>{t('advanced')}</button>
        <span>
          <button type="button" className="ed-btn" disabled={index === 0} onClick={() => setStep(STEPS[index - 1] as Step)}>{t('back')}</button>
          {index < STEPS.length - 1 && <button type="button" className="ed-btn ed-btn--primary" data-testid="easy-next" onClick={() => setStep(STEPS[index + 1] as Step)}>{t('next')}</button>}
        </span>
      </footer>

      <MediaPicker open={picking !== null} onClose={() => setPicking(null)} kind={picking === 'music' ? 'audio' : 'image'} invitationId={invitationId}
        onSelect={(item) => (picking === 'music' ? setMusic(item) : addPhoto(item))} />
    </section>
  );
}
