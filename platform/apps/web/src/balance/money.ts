/** Minor units (piasters) <-> the EGP number the UI formats. */
export function minorToEgp(minor: number): number {
  return minor / 100;
}

/** Parses what a customer types ("1,000", "٥٠٠", "250.50") into piasters; null when it is not a positive amount. */
export function parseEgpToMinor(input: string): number | null {
  const western = input
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٬,\s]/g, '')
    .replace('٫', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(western)) return null;
  const minor = Math.round(Number(western) * 100);
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}
