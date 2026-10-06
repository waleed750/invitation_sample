'use client';

import {useCallback, useEffect, useRef, useState, type CSSProperties} from 'react';
import {Music, Music2} from 'lucide-react';
import {useTranslations} from 'next-intl';
import type {InvitationData} from '@platform/shared';
import type {Locale} from '@platform/shared';
import {InvitationLocaleContext} from './InvitationLocaleContext';
import {InvitationPlaybackContext} from './InvitationPlaybackContext';
import {sectionComponents} from './registry';
import {sectionKey} from './section-key';
import {introKindFor} from './intro-kind';
import VideoOpenIntro from './intros/VideoOpenIntro';
import ScratchRevealIntro from './intros/ScratchRevealIntro';
import ShuttersIntro from './intros/ShuttersIntro';
import './styles/shell.css';

export default function InvitationShell({data, locale, templateSlug}: {data: InvitationData; locale: Locale; templateSlug?: string}) {
  const {theme, media, copy, sections, template} = data;
  const audioRef = useRef<HTMLAudioElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [opened, setOpened] = useState(false);
  const [introDone, setIntroDone] = useState(template.introType === 'none');
  const [musicPlaying, setMusicPlaying] = useState(false);
  const t = useTranslations('engine');
  const finishIntro = useCallback(() => setIntroDone(true), []);
  const scratch = sections.find(section => section.type === 'scratchReveal');
  const introKind = introKindFor(template.introType);

  useEffect(() => {
    if (!introDone) return;
    const elements = Array.from(contentRef.current?.querySelectorAll('[data-reveal]') ?? []);
    if (!('IntersectionObserver' in window)) {
      elements.forEach(element => element.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      });
    }, {rootMargin: '0px 0px -70px 0px', threshold: 0.16});
    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [introDone]);

  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = theme.background;
    return () => { document.body.style.background = previous; };
  }, [theme.background]);

  async function startExperience() {
    if (opened) return;
    setOpened(true);
    if (!audioRef.current) return;
    try { await audioRef.current.play(); setMusicPlaying(true); }
    catch { setMusicPlaying(false); }
  }
  async function toggleMusic() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try { await audio.play(); setMusicPlaying(true); }
      catch { setMusicPlaying(false); }
    } else { audio.pause(); setMusicPlaying(false); }
  }
  const style = {
    '--background': theme.background, '--foreground': theme.foreground,
    '--muted': theme.muted, '--ivory': theme.ivory
  } as CSSProperties;

  return (
    <InvitationLocaleContext.Provider value={locale}>
      <InvitationPlaybackContext.Provider value={{contentVisible: introDone && opened}}>
        <main className="invitation-shell" data-layout={template.layoutFamily} data-template={templateSlug} dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale} style={style}>
          {media.musicUrl && <audio ref={audioRef} loop preload="none" src={media.musicUrl} />}
          {introKind === 'scratch' && scratch ? (
            <ScratchRevealIntro {...scratch.props} tapLabel={copy.tapLabel ?? scratch.props.tapLabel} isOpen={opened}
              onOpen={startExperience} onRevealed={finishIntro} />
          ) : introKind === 'video' || introKind === 'scratch' ? (
            <VideoOpenIntro posterUrl={media.introPosterUrl} videoUrl={media.introVideoUrl} tapLabel={copy.tapLabel}
              isOpen={opened} isFinished={introDone} onStart={startExperience} onFinished={finishIntro} />
          ) : introKind === 'shutters' ? (
            <ShuttersIntro tapLabel={copy.tapLabel} isOpen={opened} isFinished={introDone}
              onStart={startExperience} onFinished={finishIntro} />
          ) : !opened ? <button type="button" className="open-experience" onClick={startExperience}>{t('tapOpen')}</button> : null}
          {media.musicUrl && (
            <button className={`music-button ${introDone ? 'is-visible' : ''}`} type="button"
              disabled={!opened || !introDone} aria-label={musicPlaying ? t('pauseMusic') : t('playMusic')} onClick={toggleMusic}>
              {musicPlaying ? <Music2 size={19} /> : <Music size={19} />}
            </button>
          )}
          <div ref={contentRef} className={`invitation-content ${introDone ? 'is-visible' : ''}`} inert={!introDone} aria-hidden={!introDone}>
            {sections.map((section, index) => {
              const Component = sectionComponents[section.type];
              return Component ? <Component key={sectionKey(section, index)} section={section} /> : null;
            })}
          </div>
        </main>
      </InvitationPlaybackContext.Provider>
    </InvitationLocaleContext.Provider>
  );
}
