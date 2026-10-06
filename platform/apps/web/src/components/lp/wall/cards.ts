export type WallStyle = 'royal' | 'soft' | 'modern' | 'boho' | 'heritage';
export type WallVariant = 'red' | 'ink' | 'mint';
export type WallNameKey = 'live.name' | 'soonNames.a' | 'soonNames.b' | 'soonNames.c';

export type WallCard = {
  key: string;
  status: 'live' | 'soon';
  styles: WallStyle[];
  nameKey: WallNameKey;
  variant: WallVariant;
  height: string;
};

export const WALL_STYLES: readonly WallStyle[] = ['royal', 'soft', 'modern', 'boho', 'heritage'];

// 26rem for the live design, then 22/18/22 so no two neighbours — including the marquee seam — share a height.
const HEIGHTS = ['26rem', '22rem', '18rem', '22rem'];

const SPECS: ReadonlyArray<Omit<WallCard, 'height'>> = [
  {key: 'live', status: 'live', styles: ['heritage'], nameKey: 'live.name', variant: 'ink'},
  {key: 'soon-a', status: 'soon', styles: ['royal'], nameKey: 'soonNames.a', variant: 'red'},
  {key: 'soon-b', status: 'soon', styles: ['soft', 'boho'], nameKey: 'soonNames.b', variant: 'mint'},
  {key: 'soon-c', status: 'soon', styles: ['modern'], nameKey: 'soonNames.c', variant: 'ink'},
];

/** The wall is honest: one live design plus three "coming soon" silhouettes, always in the same order. */
export function buildWallCards(): WallCard[] {
  return SPECS.map((spec, index) => ({...spec, styles: [...spec.styles], height: HEIGHTS[index]}));
}

/** True when the active style chip should fade this card out (opacity .35). */
export function filterDim(styles: readonly WallStyle[], active: WallStyle | null): boolean {
  return active !== null && !styles.includes(active);
}
