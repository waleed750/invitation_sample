'use client';

import {useEffect, useMemo, useRef, useState} from 'react';
import {NextIntlClientProvider, type AbstractIntlMessages} from 'next-intl';
import {parseInvitationData, toInvitationData, type InvitationData, type InvitationDocument} from '@platform/shared';
import InvitationShell from '@/engine/InvitationShell';
import {InvitationActionsContext} from '@/engine/InvitationActionsContext';
import {isParentMessage} from './protocol';

/** Previews never send anything to the server: replies "succeed" locally so a form can be tried out. */
const PREVIEW_ACTIONS = {
  submitRsvp: () => Promise.resolve({ok: true}),
  submitMessage: () => Promise.resolve({ok: true}),
};

/**
 * The inside of the editor's preview iframe: the real invitation renderer, fed the draft document the editor posts.
 * The intro animation is skipped so editing is immediate. The preview language is the frame's own locale
 * (the editor reloads the frame when the language changes, because the UI messages are per locale).
 */
export function PreviewFrameHost({templateSlug, locale, messages}: {templateSlug: string; locale: 'ar' | 'en'; messages: AbstractIntlMessages}) {
  const [document, setDocument] = useState<InvitationDocument | null>(null);
  const confirmed = useRef(false);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (!isParentMessage(event.data)) return;
      if (event.data.type === 'editor:doc') {
        setDocument(event.data.document);
        if (!confirmed.current) {
          confirmed.current = true;
          window.parent.postMessage({type: 'editor:frame-ready'}, window.location.origin);
        }
      } else {
        const content = window.document.querySelector('.invitation-content');
        const target = content?.children.item(event.data.index);
        if (target instanceof HTMLElement) target.scrollIntoView({behavior: 'smooth', block: 'start'});
      }
    };
    window.addEventListener('message', onMessage);
    window.parent.postMessage({type: 'editor:frame-ready'}, window.location.origin);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const data: InvitationData | null = useMemo(() => {
    if (document === null) return null;
    const flat = toInvitationData(document);
    const parsed = parseInvitationData({...flat, template: {...flat.template, introType: 'none'}});
    return parsed.ok ? parsed.data : null;
  }, [document]);

  if (data === null) return <div className="editor-frame-empty" aria-busy="true" />;
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <InvitationActionsContext.Provider value={PREVIEW_ACTIONS}>
        <InvitationShell data={data} locale={locale} templateSlug={templateSlug} autoOpen />
      </InvitationActionsContext.Provider>
    </NextIntlClientProvider>
  );
}
