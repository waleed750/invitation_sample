// Pure, deterministic helpers for the Journey beat — kept free of React/CSS imports so
// they can be unit-tested in a plain node environment.

export type StepIntersection = {
  step: number;
  ratio: number;
  isIntersecting: boolean;
};

/** Pick the active step from a batch of IntersectionObserver entries: the one with the largest visible ratio wins, later steps break ties. Returns 0 when nothing is intersecting. */
export function activeStepFromIntersections(items: readonly StepIntersection[]): number {
  let best = 0;
  let bestRatio = 0;
  for (const item of items) {
    if (!item.isIntersecting || !Number.isFinite(item.ratio)) continue;
    if (item.ratio > bestRatio || (item.ratio === bestRatio && item.step > best)) {
      best = item.step;
      bestRatio = item.ratio;
    }
  }
  return best;
}

/** Clamp a step index into [1, maxStep], rounding decimals and falling back to 1 for non-finite input. */
export function clampStep(step: number, maxStep = 3): number {
  if (!Number.isFinite(step)) return 1;
  return Math.min(maxStep, Math.max(1, Math.round(step)));
}

/** Cubic ease-out, input clamped to [0, 1]. */
export function easeOut(t: number): number {
  const p = t <= 0 ? 0 : t >= 1 ? 1 : t;
  return 1 - Math.pow(1 - p, 3);
}

/** Map an eased progress value to a whole count between 0 and total. */
export function easedCount(progress: number, total: number): number {
  return Math.round(easeOut(progress) * total);
}