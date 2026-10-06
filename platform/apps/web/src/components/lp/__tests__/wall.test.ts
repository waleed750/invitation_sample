import {describe, expect, it} from 'vitest';
import {buildWallCards, filterDim, WALL_STYLES} from '../wall/cards';

describe('filterDim', () => {
  it('keeps every card at full opacity while no style chip is active', () => {
    expect(filterDim(['royal'], null)).toBe(false);
    expect(filterDim([], null)).toBe(false);
  });

  it('keeps cards that carry the active style', () => {
    expect(filterDim(['heritage'], 'heritage')).toBe(false);
    expect(filterDim(['soft', 'boho'], 'boho')).toBe(false);
  });

  it('dims cards that do not carry the active style', () => {
    expect(filterDim(['soft'], 'boho')).toBe(true);
    expect(filterDim(['heritage'], 'royal')).toBe(true);
    expect(filterDim([], 'modern')).toBe(true);
  });
});

describe('buildWallCards', () => {
  const cards = buildWallCards();

  it('is deterministic', () => {
    expect(buildWallCards()).toEqual(cards);
    expect(buildWallCards()).not.toBe(cards);
  });

  it('is one live design plus three coming-soon cards', () => {
    expect(cards).toHaveLength(4);
    expect(cards.filter((card) => card.status === 'live')).toHaveLength(1);
    expect(cards.filter((card) => card.status === 'soon')).toHaveLength(3);
    expect(new Set(cards.map((card) => card.key)).size).toBe(cards.length);
    expect(new Set(cards.map((card) => card.nameKey)).size).toBe(cards.length);
  });

  it('gives the live card the heritage tag and an ink invitation', () => {
    const live = cards.find((card) => card.status === 'live');
    expect(live).toMatchObject({styles: ['heritage'], nameKey: 'live.name', variant: 'ink'});
  });

  it('tags every filter chip to at least one card', () => {
    const tagged = new Set(cards.flatMap((card) => card.styles));
    expect([...tagged].sort()).toEqual([...WALL_STYLES].sort());
    for (const style of WALL_STYLES) {
      expect(cards.some((card) => !filterDim(card.styles, style))).toBe(true);
    }
  });

  it('only ever uses flat invitation variants', () => {
    expect(cards.map((card) => card.variant)).toEqual(['ink', 'red', 'mint', 'ink']);
  });

  it('alternates the three silhouette heights with no repeat at the loop seam', () => {
    const heights = cards.map((card) => card.height);
    expect(new Set(heights)).toEqual(new Set(['18rem', '22rem', '26rem']));
    heights.forEach((height, index) => {
      expect(height).not.toBe(heights[(index + 1) % heights.length]);
    });
  });
});
