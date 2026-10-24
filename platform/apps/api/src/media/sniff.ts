export type MediaKind = 'image' | 'video' | 'audio';

export interface SniffedType {
  kind: MediaKind;
  /** Canonical type derived from the file's own bytes (never from the client's claim). */
  contentType: string;
  extension: string;
}

/** Bytes the sniffer needs from the start of a file. */
export const SNIFF_BYTES = 16;

function ascii(head: Buffer, start: number, end: number): string {
  return head.subarray(start, end).toString('latin1');
}

function startsWith(head: Buffer, bytes: readonly number[]): boolean {
  return head.length >= bytes.length && bytes.every((byte, index) => head[index] === byte);
}

/**
 * Identifies an upload from its magic bytes: jpeg/png/webp/heic (images), mp4/webm (video), mp3/m4a (audio).
 * Returns `null` for anything else — including an executable renamed to `.jpg`.
 */
export function sniffMediaType(head: Buffer): SniffedType | null {
  if (startsWith(head, [0xff, 0xd8, 0xff])) return {kind: 'image', contentType: 'image/jpeg', extension: 'jpg'};
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return {kind: 'image', contentType: 'image/png', extension: 'png'};
  if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 12) === 'WEBP') return {kind: 'image', contentType: 'image/webp', extension: 'webp'};
  if (startsWith(head, [0x1a, 0x45, 0xdf, 0xa3])) return {kind: 'video', contentType: 'video/webm', extension: 'webm'};
  if (ascii(head, 4, 8) === 'ftyp') {
    const brand = ascii(head, 8, 12);
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'].includes(brand)) return {kind: 'image', contentType: 'image/heic', extension: 'heic'};
    if (brand === 'M4A ' || brand === 'M4B ') return {kind: 'audio', contentType: 'audio/mp4', extension: 'm4a'};
    if (['isom', 'iso2', 'mp41', 'mp42', 'avc1', 'dash', 'M4V ', 'qt  '].includes(brand)) return {kind: 'video', contentType: 'video/mp4', extension: 'mp4'};
    return null;
  }
  if (ascii(head, 0, 3) === 'ID3') return {kind: 'audio', contentType: 'audio/mpeg', extension: 'mp3'};
  // Raw MPEG audio frame sync (11 set bits) with a valid layer.
  if (head.length >= 2 && head.readUInt8(0) === 0xff && (head.readUInt8(1) & 0xe0) === 0xe0 && (head.readUInt8(1) & 0x06) !== 0) {
    return {kind: 'audio', contentType: 'audio/mpeg', extension: 'mp3'};
  }
  return null;
}
