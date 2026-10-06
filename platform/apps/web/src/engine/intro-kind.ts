import type {TemplateMeta} from '@platform/shared';

export type IntroKind = 'video' | 'scratch' | 'shutters' | 'envelope' | 'none';

const introKinds = {
  'video-open': 'video',
  'scratch-reveal': 'scratch',
  'tap-to-open': 'shutters',
  envelope: 'envelope',
  none: 'none'
} as const satisfies Record<TemplateMeta['introType'], IntroKind>;

export function introKindFor(introType: TemplateMeta['introType']): IntroKind {
  return introKinds[introType];
}
