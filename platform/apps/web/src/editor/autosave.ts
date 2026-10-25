'use client';

import {useCallback, useEffect, useRef, type Dispatch} from 'react';
import {EditorApiError, saveDocument} from './api';
import type {EditorAction, EditorState} from './state';

export const AUTOSAVE_DELAY_MS = 800;
export const OFFLINE_RETRY_MS = 5000;

/** Saves the document a moment after the last change. Conflicts stop saving (the editor then asks to reload). */
export function useAutosave(state: EditorState, dispatch: Dispatch<EditorAction>, invitationId: string): {saveNow: () => Promise<boolean>} {
  const inFlight = useRef(false);
  const latest = useRef(state);
  latest.current = state;

  const run = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) return false;
    const current = latest.current;
    if (current.status === 'conflict') return false;
    inFlight.current = true;
    const document = current.doc;
    dispatch({type: 'saveStarted'});
    try {
      const result = await saveDocument(invitationId, document, current.version);
      dispatch({type: 'saveSucceeded', savedDoc: document, version: result.updatedAt});
      return true;
    } catch (error) {
      if (error instanceof EditorApiError) {
        if (error.code === 'network') dispatch({type: 'saveFailed', status: 'offline'});
        else if (error.status === 409 && error.code === 'edit_conflict') dispatch({type: 'saveFailed', status: 'conflict', errorCode: error.code});
        else dispatch({type: 'saveFailed', status: 'error', errorCode: error.code});
      } else dispatch({type: 'saveFailed', status: 'error', errorCode: 'generic'});
      return false;
    } finally {
      inFlight.current = false;
    }
  }, [dispatch, invitationId]);

  useEffect(() => {
    if (state.status !== 'unsaved') return;
    const timer = window.setTimeout(() => void run(), AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [state.status, state.doc, run]);

  useEffect(() => {
    const goOffline = () => dispatch({type: 'saveFailed', status: 'offline'});
    const goOnline = () => dispatch({type: 'online'});
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, [dispatch]);

  // A failed save while "online" (flaky network) retries by itself.
  useEffect(() => {
    if (state.status !== 'offline') return;
    const timer = window.setTimeout(() => {
      if (navigator.onLine) dispatch({type: 'online'});
    }, OFFLINE_RETRY_MS);
    return () => window.clearTimeout(timer);
  }, [state.status, dispatch]);

  // Closing the tab with unsaved changes asks first.
  useEffect(() => {
    if (state.status === 'saved') return;
    const guard = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [state.status]);

  /** Saves immediately (for Publish): resolves true once the server has the current document. */
  const saveNow = useCallback(async (): Promise<boolean> => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const status = latest.current.status;
      if (status === 'saved') return true;
      if (status === 'conflict') return false;
      if (status !== 'saving') await run();
      else await new Promise((resolve) => window.setTimeout(resolve, 200));
    }
    return latest.current.status === 'saved';
  }, [run]);

  return {saveNow};
}
