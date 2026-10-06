import { TIERS, TIER_ORDER } from '@platform/shared';

export type ComparisonRow = {
  key: string;
  render: (value: number | boolean | null) => number | string | boolean | null;
  values: {
    [key in typeof TIER_ORDER[number]]: number | boolean | null;
  };
};

export function comparisonRows(): ComparisonRow[] {
  return [
    {
      key: 'publishedEdits',
      render: (v) => v,
      values: {
        'save-the-date': TIERS['save-the-date'].editsAllowed,
        classic: TIERS.classic.editsAllowed,
        premium: TIERS.premium.editsAllowed,
      }
    },
    {
      key: 'monthsOnline',
      render: (v) => v,
      values: {
        'save-the-date': TIERS['save-the-date'].onlineMonths,
        classic: TIERS.classic.onlineMonths,
        premium: TIERS.premium.onlineMonths,
      }
    },
    {
      key: 'rsvpLimit',
      render: (v) => v === null ? 'unlimited' : v,
      values: {
        'save-the-date': TIERS['save-the-date'].rsvpLimit,
        classic: TIERS.classic.rsvpLimit,
        premium: TIERS.premium.rsvpLimit,
      }
    },
    {
      key: 'videoIntro',
      render: (v) => v,
      values: {
        'save-the-date': TIERS['save-the-date'].videoIntro,
        classic: TIERS.classic.videoIntro,
        premium: TIERS.premium.videoIntro,
      }
    },
    {
      key: 'musicUpload',
      render: (v) => v,
      values: {
        'save-the-date': TIERS['save-the-date'].musicUpload,
        classic: TIERS.classic.musicUpload,
        premium: TIERS.premium.musicUpload,
      }
    },
    {
      key: 'guestMessages',
      render: (v) => v,
      values: {
        'save-the-date': TIERS['save-the-date'].guestMessages,
        classic: TIERS.classic.guestMessages,
        premium: TIERS.premium.guestMessages,
      }
    },
    {
      key: 'prioritySupport',
      render: (v) => v,
      values: {
        'save-the-date': TIERS['save-the-date'].prioritySupport,
        classic: TIERS.classic.prioritySupport,
        premium: TIERS.premium.prioritySupport,
      }
    }
  ];
}
