'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import type {InvitationDocument} from '@platform/shared';
import {isFrameMessage, type ParentToFrame} from './protocol';

export type Device = 'mobile' | 'tablet' | 'desktop';
const STORAGE_KEY = 'editor.device';
const SIZES: Record<Device, {width: number; height: number}> = {mobile: {width: 390, height: 800}, tablet: {width: 768, height: 1024}, desktop: {width: 1280, height: 800}};

export function loadDevice(): {device: Device; landscape: boolean} {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const [device, orientation] = raw.split(':');
      if (device === 'mobile' || device === 'tablet' || device === 'desktop') return {device, landscape: orientation === 'landscape' && device === 'tablet'};
    }
  } catch {
    // storage can be unavailable (private window); the default is fine
  }
  return {device: 'mobile', landscape: false};
}

interface Props {
  document: InvitationDocument;
  templateSlug: string;
  locale: 'ar' | 'en';
  focusIndex: number | null;
  device: Device;
  landscape: boolean;
  onDevice: (device: Device, landscape: boolean) => void;
}

/** A device-sized iframe of the real renderer, scaled to fit, kept in sync by postMessage. */
export function Preview({document: doc, templateSlug, locale, focusIndex, device, landscape, onDevice}: Props) {
  const t = useTranslations('editor');
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(0);
  const latest = useRef({doc, locale});
  latest.current = {doc, locale};

  const post = useCallback((message: ParentToFrame) => {
    frame.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  // The frame announces itself; then it gets the current document.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (isFrameMessage(event.data)) {
        setReady(true);
        post({type: 'editor:doc', document: latest.current.doc, locale: latest.current.locale});
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [post]);

  useEffect(() => {
    if (ready) post({type: 'editor:doc', document: doc, locale});
  }, [doc, locale, ready, post]);

  useEffect(() => {
    if (ready && focusIndex !== null) post({type: 'editor:focus', index: focusIndex});
  }, [focusIndex, ready, post]);

  useEffect(() => setReady(false), [locale, templateSlug]);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setAvailable(element.clientWidth));
    observer.observe(element);
    setAvailable(element.clientWidth);
    return () => observer.disconnect();
  }, []);

  const base = SIZES[device];
  const size = device === 'tablet' && landscape ? {width: base.height, height: base.width} : base;
  const scale = available > 0 ? Math.min(1, available / size.width) : 1;

  function choose(next: Device, nextLandscape: boolean) {
    onDevice(next, nextLandscape);
    try {
      window.localStorage.setItem(STORAGE_KEY, `${next}:${nextLandscape ? 'landscape' : 'portrait'}`);
    } catch {
      // not remembered, still works
    }
  }

  return (
    <div className="ed-preview">
      <div className="ed-devices" role="group" aria-label={t('device')}>
        {(['mobile', 'tablet', 'desktop'] as const).map((value) => (
          <button key={value} type="button" aria-pressed={device === value} data-testid={`device-${value}`} onClick={() => choose(value, value === 'tablet' ? landscape : false)}>
            {t(`devices.${value}`)} <small dir="ltr">{SIZES[value].width}</small>
          </button>
        ))}
        {device === 'tablet' && (
          <button type="button" aria-pressed={landscape} data-testid="device-rotate" onClick={() => choose('tablet', !landscape)}>{t('rotate')}</button>
        )}
      </div>
      <div className="ed-stage" ref={stage}>
        <div className="ed-device" style={{inlineSize: size.width * scale, blockSize: size.height * scale}} data-testid="preview-box" data-width={size.width}>
          <iframe
            ref={frame}
            title={t('previewTitle')}
            src={`/${locale}/editor-frame/${templateSlug}`}
            style={{inlineSize: size.width, blockSize: size.height, transform: `scale(${String(scale)})`, transformOrigin: '0 0'}}
            data-ready={ready}
          />
        </div>
      </div>
    </div>
  );
}
