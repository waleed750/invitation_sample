import * as React from 'react';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it} from 'vitest';
import {TIERS} from '@platform/shared';
import {getDiwanData} from '../templates/diwan/data';
import {PlanComparison, type PlanComparisonLabels} from './PlanComparison';
import {
  NAME_MAX,
  checkoutHref,
  cleanName,
  detailsQuery,
  gridHref,
  isValidIsoDate,
  parsePickParams,
  previewFrameSrc,
  templateStepHref
} from './params';
import {personalizeData} from './personalize';
import {isTier, planViews} from './plans';

// Vitest compiles JSX with the classic runtime, which expects a global React.
(globalThis as {React?: unknown}).React = React;

describe('parsePickParams', () => {
  it('accepts valid input', () => {
    const r = parsePickParams({first: ' Sara ', second: 'Omar', date: '2027-05-20'}, '2026-10-09');
    expect(r).toMatchObject({first: 'Sara', second: 'Omar', date: '2027-05-20', complete: true, errors: {}});
  });

  it('falls back to safe empty defaults', () => {
    const r = parsePickParams({});
    expect(r).toMatchObject({first: '', second: '', date: '', complete: false});
    expect(r.errors).toEqual({first: 'missing', second: 'missing', date: 'missing'});
  });

  it('takes the first value of repeated params', () => {
    expect(parsePickParams({first: ['A', 'B'], second: 'C', date: '2027-01-01'}).first).toBe('A');
  });

  it('rejects malformed, impossible and past dates', () => {
    expect(parsePickParams({first: 'a', second: 'b', date: '20-05-2027'}).errors.date).toBe('invalid');
    expect(parsePickParams({first: 'a', second: 'b', date: '2027-02-30'}).errors.date).toBe('invalid');
    expect(parsePickParams({first: 'a', second: 'b', date: '2020-01-01'}, '2026-10-09').errors.date).toBe('past');
    expect(parsePickParams({first: 'a', second: 'b', date: '2020-01-01'}).complete).toBe(true);
    expect(isValidIsoDate('2028-02-29')).toBe(true);
    expect(isValidIsoDate('2027-02-29')).toBe(false);
  });

  it('limits and sanitises names', () => {
    expect(Array.from(cleanName('x'.repeat(80))).length).toBe(NAME_MAX);
    expect(cleanName('  Sara &  <b>Omar</b>, \n x ')).toBe('Sara b Omar /b x');
    expect(parsePickParams({first: '&&&', second: 'b', date: '2027-01-01'}).errors.first).toBe('missing');
  });
});

describe('link builders', () => {
  const details = {first: 'Sara', second: 'Omar', date: '2027-05-20'};

  it('builds the exact checkout URL the existing checkout page reads', () => {
    expect(checkoutHref('diwan', 'classic', details)).toBe(
      '/checkout/diwan?tier=classic&names=Sara+%26+Omar&date=2027-05-20'
    );
  });

  it('encodes Arabic names and omits empty fields', () => {
    expect(checkoutHref('diwan', 'premium', {first: 'سارة', second: 'عمر', date: ''})).toBe(
      `/checkout/diwan?tier=premium&names=${encodeURIComponent('سارة & عمر').replace(/%20/gu, '+')}`
    );
  });

  it('keeps the details in the URL for the other steps', () => {
    expect(gridHref(details)).toBe('/app/new?first=Sara&second=Omar&date=2027-05-20');
    expect(gridHref({first: '', second: '', date: ''})).toBe('/app/new');
    expect(templateStepHref('diwan', details, 'premium')).toBe(
      '/app/new/diwan?first=Sara&second=Omar&date=2027-05-20&tier=premium'
    );
    expect(previewFrameSrc('ar', 'diwan', details)).toBe('/ar/pick-preview/diwan?first=Sara&second=Omar&date=2027-05-20');
    expect(detailsQuery(details, {plan: 'classic'})).toContain('plan=classic');
  });
});

describe('plan comparison data', () => {
  it('maps every tier from TIERS in order', () => {
    const plans = planViews();
    expect(plans.map((p) => p.tier)).toEqual(['save-the-date', 'classic', 'premium']);
    for (const plan of plans) {
      expect(plan).toMatchObject({
        price: TIERS[plan.tier].price,
        editsAllowed: TIERS[plan.tier].editsAllowed,
        onlineMonths: TIERS[plan.tier].onlineMonths,
        rsvpLimit: TIERS[plan.tier].rsvpLimit
      });
    }
    expect(plans[0].rsvpLimit).toBe(0);
    expect(plans[2].rsvpLimit).toBeNull();
    expect(plans[2].features.videoIntro).toBe(true);
    expect(plans[1].features.musicUpload).toBe(false);
  });

  it('validates tier ids', () => {
    expect(isTier('classic')).toBe(true);
    expect(isTier('gold')).toBe(false);
    expect(isTier(undefined)).toBe(false);
  });
});

describe('personalizeData', () => {
  it('injects names and date without mutating the template', () => {
    const original = getDiwanData();
    const before = JSON.stringify(original);
    const result = personalizeData(original, {first: 'Sara', second: 'Omar', date: '2031-03-04'}, 'en');
    expect(JSON.stringify(original)).toBe(before);
    expect(result.couple.firstName).toBe('Sara');
    expect(result.couple.secondName).toBe('Omar');
    expect(String(result.event.date)).toMatch(/^2031-03-04T/u);
    const hero = result.sections.find((s) => s.type === 'hero');
    if (hero?.type === 'hero') {
      expect(hero.props.firstName).toBe('Sara');
      expect(hero.props.displayDate).toContain('2031');
    }
    const countdown = result.sections.find((s) => s.type === 'countdown');
    if (countdown?.type === 'countdown') expect(countdown.props.date.startsWith('2031-03-04T')).toBe(true);
  });
});

describe('PlanComparison', () => {
  const labels: PlanComparisonLabels = {
    title: 'Compare plans',
    selected: 'Selected plan',
    choose: 'Choose',
    tierNames: {'save-the-date': 'STD', classic: 'Classic', premium: 'Premium'},
    edits: 'Edits',
    online: 'Online',
    rsvp: 'RSVP',
    rsvpNone: 'None',
    rsvpUnlimited: 'Unlimited',
    videoIntro: 'Video',
    musicUpload: 'Music',
    guestMessages: 'Messages',
    prioritySupport: 'Support',
    yes: 'Yes',
    no: 'No'
  };

  it('renders every plan, marks the selected one and links the others', () => {
    const html = renderToStaticMarkup(
      createElement(PlanComparison, {
        plans: planViews(),
        selected: 'classic',
        labels,
        prices: {'save-the-date': 'EGP 499', classic: 'EGP 1,299', premium: 'EGP 2,499'},
        months: {'save-the-date': '3 months', classic: '6 months', premium: '12 months'},
        hrefs: {'save-the-date': '/en/a', classic: '/en/b', premium: '/en/c'}
      })
    );
    expect(html).toContain('EGP 1,299');
    expect(html).toContain('Unlimited');
    expect(html).toContain('None');
    expect(html.match(/pick-plan is-selected/gu)).toHaveLength(1);
    expect(html).toContain('Selected plan');
    expect(html).toContain('href="/en/a"');
    expect(html).toContain('href="/en/c"');
    expect(html).not.toContain('href="/en/b"');
  });
});
