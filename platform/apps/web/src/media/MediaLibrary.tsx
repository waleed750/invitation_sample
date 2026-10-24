'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import {Bidi} from '@/components/Bidi';
import {formatBytes} from './format';
import {MediaApiError, deleteMedia, listMedia, uploadMedia, type MediaItem, type MediaList} from './api';

interface Props {
  /** When set, tiles get a "use this" button and the library works as a picker. */
  onSelect?: (item: MediaItem) => void;
  selectedId?: string | null;
  /** Limit the picker to one kind of file. */
  kind?: 'image' | 'video' | 'audio';
  invitationId?: string;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,video/mp4,video/webm,audio/mpeg,audio/mp4';

export function MediaLibrary({onSelect, selectedId = null, kind, invitationId}: Props) {
  const t = useTranslations('media');
  const [data, setData] = useState<MediaList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const message = useCallback((failure: unknown): string => {
    const code = failure instanceof MediaApiError ? failure.code : 'generic';
    return t.has(`errors.${code}`) ? t(`errors.${code}`) : t('errors.generic');
  }, [t]);

  const refresh = useCallback(async () => {
    try {
      setData(await listMedia());
    } catch (failure) {
      setError(message(failure));
    }
  }, [message]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function send(files: FileList | File[]) {
    const file = Array.from(files)[0];
    if (!file) return;
    setError(null);
    setProgress(0);
    try {
      await uploadMedia(file, {invitationId, onProgress: setProgress});
    } catch (failure) {
      setError(message(failure));
    } finally {
      setProgress(null);
      if (input.current) input.current.value = '';
    }
    await refresh();
  }

  async function remove(id: string) {
    setConfirming(null);
    setError(null);
    try {
      await deleteMedia(id);
    } catch (failure) {
      setError(message(failure));
    }
    await refresh();
  }

  const items = (data?.items ?? []).filter((item) => !kind || item.kind === kind);
  const usage = data?.usage;
  const percent = usage ? Math.min(100, Math.round((usage.count / Math.max(1, usage.maxCount)) * 100)) : 0;

  return (
    <div className="media-library">
      {usage && (
        <div className="media-usage" aria-live="polite">
          <div className="media-usage__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <span style={{inlineSize: `${String(percent)}%`}} />
          </div>
          <p>
            {t('usage', {count: usage.count, max: usage.maxCount})} · {t('usageBytes', {size: formatBytes(usage.bytes)})}
          </p>
          <p className="media-usage__limits">
            {t('limits', {
              image: formatBytes(usage.maxBytes.image),
              video: usage.maxBytes.video > 0 ? t('limitVideo', {size: formatBytes(usage.maxBytes.video)}) : '',
              audio: usage.maxBytes.audio > 0 ? t('limitAudio', {size: formatBytes(usage.maxBytes.audio)}) : '',
            })}
          </p>
        </div>
      )}

      <div
        className={`media-drop${dragging ? ' is-dragging' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); void send(event.dataTransfer.files); }}
      >
        <input ref={input} id="media-file" className="media-drop__input" type="file" accept={ACCEPT} onChange={(event) => { if (event.target.files) void send(event.target.files); }} />
        <label htmlFor="media-file" className="button media-drop__button">{progress === null ? t('upload') : t('uploading', {percent: progress})}</label>
        <span className="media-drop__hint">{t('drop')}</span>
      </div>

      {error && <p className="media-error" role="alert">{error}</p>}

      {!data && !error && <p className="media-note">{t('loading')}</p>}
      {data && items.length === 0 && <p className="media-note">{t('empty')}</p>}

      <ul className="media-grid">
        {items.map((item) => {
          const thumb = item.variants[0]?.url ?? (item.kind === 'image' ? item.url : null);
          return (
            <li key={item.id} className={`media-tile${selectedId === item.id ? ' is-selected' : ''}${item.status === 'rejected' ? ' is-rejected' : ''}`} data-testid="media-tile">
              <div className="media-tile__preview">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt={item.originalName ?? ''} loading="lazy" width={item.width ?? undefined} height={item.height ?? undefined} />
                ) : (
                  <span className="media-tile__kind">{item.kind ? t(`kinds.${item.kind}`) : ''}</span>
                )}
                {item.status === 'processing' && <span className="media-tile__badge">{t('processing')}</span>}
                {item.status === 'rejected' && <span className="media-tile__badge is-error">{t('rejected')}</span>}
              </div>
              <p className="media-tile__name" dir="auto">{item.originalName}</p>
              <p className="media-tile__meta"><Bidi>{item.sizeBytes ? formatBytes(item.sizeBytes) : ''}</Bidi></p>
              <div className="media-tile__actions">
                {onSelect && item.status === 'ready' && (
                  <button type="button" className="button" onClick={() => onSelect(item)}>
                    {selectedId === item.id ? t('selected') : t('select')}
                  </button>
                )}
                {confirming === item.id ? (
                  <>
                    <button type="button" className="media-danger" onClick={() => void remove(item.id)}>{t('removeYes')}</button>
                    <button type="button" className="media-link" onClick={() => setConfirming(null)}>{t('removeNo')}</button>
                  </>
                ) : (
                  <button type="button" className="media-link" onClick={() => setConfirming(item.id)} aria-label={`${t('remove')} ${item.originalName ?? ''}`}>{t('remove')}</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
