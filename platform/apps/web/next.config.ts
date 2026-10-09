import type {NextConfig} from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import {securityHeaders} from './src/security/headers';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const nextConfig: NextConfig = {
  transpilePackages: ['@platform/shared', '@platform/api-client'],
  poweredByHeader: false,
  headers: () => Promise.resolve(securityHeaders())
};
export default withNextIntl(nextConfig);
