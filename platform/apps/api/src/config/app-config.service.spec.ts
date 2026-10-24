import {ConfigService} from '@nestjs/config';
import {AppConfigService} from './app-config.service';
import {validateEnv} from './env.schema';
import {setTestEnv} from '../test-helpers';

setTestEnv();

function serviceFor(overrides: Record<string, string>): AppConfigService {
  const env = validateEnv({
    PORT: '3001',
    NODE_ENV: 'development',
    WEB_ORIGINS: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://app_api:pw@127.0.0.1:5432/postgres',
    THROTTLE_TTL_MS: '60000',
    THROTTLE_LIMIT: '100',
    PAYMENTS_PROVIDER: 'mock',
    PAYMENTS_MOCK_SECRET: 'test-mock-secret-at-least-32-characters',
    IP_HASH_SECRET: 'test-ip-hash-secret-at-least-32-chars',
    BETTER_AUTH_SECRET: 'test-better-auth-secret-at-least-32-characters',
    BETTER_AUTH_URL: 'http://localhost:3001',
    SMTP_HOST: 'localhost',
    SMTP_PORT: '1025',
    SMTP_USER: 'u',
    SMTP_PASS: 'p',
    SMTP_FROM: 'noreply@example.com',
    ...overrides
  });
  return new AppConfigService(new ConfigService(env));
}

describe('AppConfigService optional values', () => {
  it('returns undefined (not a throw) for blank optional settings', () => {
    const config = serviceFor({AUTH_COOKIE_DOMAIN: '', GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '', SENTRY_DSN: ''});
    expect(config.authCookieDomain).toBeUndefined();
    expect(config.googleClientId).toBeUndefined();
    expect(config.googleClientSecret).toBeUndefined();
    expect(config.sentryDsn).toBeUndefined();
  });

  it('returns the value when an optional setting is set', () => {
    expect(serviceFor({AUTH_COOKIE_DOMAIN: '.example.com'}).authCookieDomain).toBe('.example.com');
  });

  it('chooses the email channel: smtp in production, log elsewhere, override wins', () => {
    expect(serviceFor({}).emailChannel).toBe('log');
    expect(serviceFor({EMAIL_SENDER: 'smtp'}).emailChannel).toBe('smtp');
    expect(serviceFor({NODE_ENV: 'production', PAYMENTS_PROVIDER: 'manual'}).emailChannel).toBe('smtp');
  });
});
