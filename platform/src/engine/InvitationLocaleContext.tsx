'use client';

import {createContext, useContext} from 'react';
import {resolveText, type Locale, type LocalizedText} from '@/lib/schemas/localized';

export const InvitationLocaleContext = createContext<Locale>('ar');
export function useInvitationText() {
  const locale = useContext(InvitationLocaleContext);
  return (value: LocalizedText | undefined) => value === undefined ? '' : resolveText(value, locale);
}
