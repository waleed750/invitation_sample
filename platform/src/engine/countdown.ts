/** Millisecond timestamps; invalid or elapsed dates produce a finished countdown. */
export function getTimeLeft(target: number, now: number) {
  const distance = Number.isFinite(target) && Number.isFinite(now) ? Math.max(0, target - now) : 0;
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance % 86400000) / 3600000),
    minutes: Math.floor((distance % 3600000) / 60000),
    seconds: Math.floor((distance % 60000) / 1000)
  };
}
