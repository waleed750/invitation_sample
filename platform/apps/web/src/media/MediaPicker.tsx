'use client';

import {useEffect, useRef} from 'react';
import {useTranslations} from 'next-intl';
import {MediaLibrary} from './MediaLibrary';
import type {MediaItem} from './api';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  selectedId?: string | null;
  kind?: 'image' | 'video' | 'audio';
  invitationId?: string;
}

/** A modal over the media library, for the editor's photo/music/video slots. */
export function MediaPicker({open, onClose, onSelect, selectedId, kind, invitationId}: Props) {
  const t = useTranslations('media');
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog ref={dialog} className="media-picker" aria-labelledby="media-picker-title" onClose={onClose}>
      <header className="media-picker__header">
        <h2 id="media-picker-title">{t('pickerTitle')}</h2>
        <button type="button" className="media-link" onClick={onClose}>{t('close')}</button>
      </header>
      {open && (
        <MediaLibrary
          onSelect={(item) => { onSelect(item); onClose(); }}
          selectedId={selectedId}
          kind={kind}
          invitationId={invitationId}
        />
      )}
    </dialog>
  );
}
