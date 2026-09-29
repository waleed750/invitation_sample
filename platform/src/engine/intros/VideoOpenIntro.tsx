/* eslint-disable @next/next/no-img-element -- The full-screen poster uses template cropping. */
'use client';
import {useEffect, useRef} from 'react';
import {useTranslations} from 'next-intl';
import type {Media, Copy} from '@/lib/schemas/invitation';
import {useInvitationText} from '../InvitationLocaleContext';
import '../styles/video-open-intro.css';

type Props = {
  posterUrl?: Media['introPosterUrl']; videoUrl?: Media['introVideoUrl']; tapLabel?: Copy['tapLabel'];
  isOpen: boolean; isFinished: boolean; onStart: () => void; onFinished: () => void;
};
export default function VideoOpenIntro({posterUrl, videoUrl, tapLabel, isOpen, isFinished, onStart, onFinished}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const text = useInvitationText();
  const t = useTranslations('engine');
  useEffect(() => {
    if (!isOpen || isFinished) return;
    const video = videoRef.current;
    if (!video || !videoUrl) { onFinished(); return; }
    let cancelled = false;
    // Start the timeout before play() so stalled media cannot trap the guest.
    const timer = window.setTimeout(onFinished, 5200);
    void video.play().catch(() => { if (!cancelled) onFinished(); });
    return () => { cancelled = true; window.clearTimeout(timer); video.pause(); };
  }, [isOpen, isFinished, onFinished, videoUrl]);
  return (
    <button className={`intro-layer ${isOpen ? 'is-playing' : ''} ${isFinished ? 'is-finished' : ''}`}
      type="button" onClick={onStart} aria-label={text(tapLabel ?? t('openInvitation'))} disabled={isFinished}>
      {posterUrl && <img className="intro-poster" src={posterUrl} alt={t('introPoster')} />}
      <video ref={videoRef} className="intro-video" src={videoUrl} muted playsInline preload="none"
        onEnded={onFinished} onError={() => { if (isOpen) onFinished(); }} />
      <span className="tap-label">{text(tapLabel ?? t('tapOpen'))}</span>
    </button>
  );
}
