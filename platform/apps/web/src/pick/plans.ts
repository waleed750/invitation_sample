import {TIER_ORDER, TIERS, type Tier} from '@platform/shared';

export type PlanView = {
  tier: Tier;
  price: number;
  editsAllowed: number;
  onlineMonths: number;
  /** null means unlimited. 0 means RSVP is not included. */
  rsvpLimit: number | null;
  features: {videoIntro: boolean; musicUpload: boolean; guestMessages: boolean; prioritySupport: boolean};
};

export function planViews(): PlanView[] {
  return TIER_ORDER.map((tier) => {
    const plan = TIERS[tier];
    return {
      tier,
      price: plan.price,
      editsAllowed: plan.editsAllowed,
      onlineMonths: plan.onlineMonths,
      rsvpLimit: plan.rsvpLimit,
      features: {
        videoIntro: plan.videoIntro,
        musicUpload: plan.musicUpload,
        guestMessages: plan.guestMessages,
        prioritySupport: plan.prioritySupport
      }
    };
  });
}

export function isTier(value: string | undefined): value is Tier {
  return TIER_ORDER.includes(value as Tier);
}
