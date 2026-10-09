import {BlockList, isIP} from 'node:net';
import type {Request} from 'express';

/** Cloudflare edge ranges (https://www.cloudflare.com/ips/). Refresh occasionally; they change rarely. */
export const CLOUDFLARE_CIDRS: readonly string[] = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18',
  '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17',
  '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
  '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32',
  '2a06:98c0::/29', '2c0f:f248::/32'
];

/** Hops that are always the operator's own infrastructure (Caddy/nginx on the same host or private network). */
const PRIVATE_HOPS = ['loopback', 'linklocal', 'uniquelocal'] as const;

/** Express `trust proxy` value. */
export type TrustProxySetting = false | number | string[];

export interface TrustProxyPlan {
  /** Value for `app.set('trust proxy', ...)`. */
  setting: TrustProxySetting;
  /** When true, `CF-Connecting-IP` is honoured if the TCP peer is a trusted hop. */
  cloudflare: boolean;
}

/**
 * Parses `TRUST_PROXY`: empty/`false` (trust nothing, use the socket address),
 * an integer hop count, `cloudflare`, or a comma-separated list of
 * `loopback`/`linklocal`/`uniquelocal`/IPs/CIDRs. `true` is rejected: trusting
 * every hop lets any client spoof `X-Forwarded-For`.
 */
export function parseTrustProxy(raw: string | undefined): TrustProxyPlan {
  const value = (raw ?? '').trim();
  if (value === '' || value.toLowerCase() === 'false') return {setting: false, cloudflare: false};
  if (/^\d+$/.test(value)) return {setting: Number(value), cloudflare: false};
  const parts = value.split(',').map((part) => part.trim()).filter((part) => part !== '');
  if (parts.length === 1 && parts[0]?.toLowerCase() === 'cloudflare') {
    return {setting: [...PRIVATE_HOPS, ...CLOUDFLARE_CIDRS], cloudflare: true};
  }
  for (const part of parts) {
    const lower = part.toLowerCase();
    if (lower === 'true' || lower === 'cloudflare') throw new Error(`TRUST_PROXY: "${part}" is not allowed in a list`);
    if ((PRIVATE_HOPS as readonly string[]).includes(lower)) continue;
    const pieces = part.split('/');
    const address = pieces[0] ?? '';
    const prefix = pieces[1] ?? '';
    const family = isIP(address);
    const prefixOk = pieces.length === 1 || (/^\d+$/.test(prefix) && Number(prefix) <= (family === 4 ? 32 : 128));
    if (family === 0 || !prefixOk || pieces.length > 2) throw new Error(`TRUST_PROXY: invalid entry "${part}"`);
  }
  return {setting: parts, cloudflare: false};
}

let trustedPeers: BlockList | undefined;
function peers(): BlockList {
  if (trustedPeers) return trustedPeers;
  const list = new BlockList();
  list.addSubnet('127.0.0.0', 8, 'ipv4');
  list.addSubnet('10.0.0.0', 8, 'ipv4');
  list.addSubnet('172.16.0.0', 12, 'ipv4');
  list.addSubnet('192.168.0.0', 16, 'ipv4');
  list.addSubnet('169.254.0.0', 16, 'ipv4');
  list.addAddress('::1', 'ipv6');
  list.addSubnet('fc00::', 7, 'ipv6');
  list.addSubnet('fe80::', 10, 'ipv6');
  for (const cidr of CLOUDFLARE_CIDRS) {
    const [address = '', prefix = '0'] = cidr.split('/');
    list.addSubnet(address, Number(prefix), address.includes(':') ? 'ipv6' : 'ipv4');
  }
  trustedPeers = list;
  return list;
}

function stripMapped(address: string): string {
  return address.toLowerCase().startsWith('::ffff:') && isIP(address.slice(7)) === 4 ? address.slice(7) : address;
}

function isTrustedPeer(address: string | undefined): boolean {
  if (!address) return false;
  const clean = stripMapped(address);
  const family = isIP(clean);
  return family !== 0 && peers().check(clean, family === 4 ? 'ipv4' : 'ipv6');
}

/** App-level setting key read by `clientIp` (set in `applySecurity`). */
export const CLIENT_IP_MODE_KEY = 'client-ip-mode';

/**
 * The real client address. Relies on Express `trust proxy` (so `req.ip` skips
 * trusted proxy hops) and, in `cloudflare` mode, on `CF-Connecting-IP` — but
 * only when the TCP peer itself is a trusted hop (our proxy or a Cloudflare
 * edge). A direct client sending a forged header is ignored.
 */
export function clientIp(req: Request): string {
  const mode = req.app.get(CLIENT_IP_MODE_KEY) as unknown;
  if (mode === 'cloudflare' && isTrustedPeer(req.socket.remoteAddress)) {
    const header = req.headers['cf-connecting-ip'];
    const value = (Array.isArray(header) ? header[0] : header)?.trim();
    if (value && isIP(value) !== 0) return stripMapped(value);
  }
  return stripMapped(req.ip ?? req.socket.remoteAddress ?? 'unknown');
}
