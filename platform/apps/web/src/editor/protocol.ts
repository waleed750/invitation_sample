import type {InvitationDocument} from '@platform/shared';

/** postMessage protocol between the editor and its preview iframe (same origin only). */
export type ParentToFrame =
  | {type: 'editor:doc'; document: InvitationDocument; locale: 'ar' | 'en'}
  | {type: 'editor:focus'; index: number};
export type FrameToParent = {type: 'editor:frame-ready'};

export function isParentMessage(data: unknown): data is ParentToFrame {
  if (typeof data !== 'object' || data === null) return false;
  const message = data as {type?: unknown; document?: unknown; index?: unknown; locale?: unknown};
  if (message.type === 'editor:doc') return typeof message.document === 'object' && message.document !== null && (message.locale === 'ar' || message.locale === 'en');
  if (message.type === 'editor:focus') return typeof message.index === 'number' && Number.isInteger(message.index) && message.index >= 0;
  return false;
}

export function isFrameMessage(data: unknown): data is FrameToParent {
  return typeof data === 'object' && data !== null && (data as {type?: unknown}).type === 'editor:frame-ready';
}
