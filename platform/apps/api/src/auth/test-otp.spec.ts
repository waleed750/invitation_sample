import {authControllersForEnv} from './auth.module';
import {TestOtpController} from './test-otp.controller';
import {testOtpStore} from './test-otp.store';
import {bootApp, type HttpClient} from '../test-helpers';
import type {INestApplication} from '@nestjs/common';

describe('Test-only email capture & OTP route', () => {
  describe('authControllersForEnv', () => {
    it('excludes TestOtpController in production even if E2E_CAPTURE_EMAILS is set', () => {
      expect(authControllersForEnv({NODE_ENV: 'production', E2E_CAPTURE_EMAILS: '1'})).toEqual([]);
      expect(authControllersForEnv({NODE_ENV: 'production', E2E_CAPTURE_EMAILS: 'true'})).toEqual([]);
      expect(authControllersForEnv({NODE_ENV: 'production'})).toEqual([]);
    });

    it('excludes TestOtpController in development when E2E_CAPTURE_EMAILS is not set', () => {
      expect(authControllersForEnv({NODE_ENV: 'development'})).toEqual([]);
      expect(authControllersForEnv({NODE_ENV: 'development', E2E_CAPTURE_EMAILS: '0'})).toEqual([]);
    });

    it('includes TestOtpController when NODE_ENV is test', () => {
      expect(authControllersForEnv({NODE_ENV: 'test'})).toEqual([TestOtpController]);
    });

    it('includes TestOtpController in development when E2E_CAPTURE_EMAILS is 1 or true', () => {
      expect(authControllersForEnv({NODE_ENV: 'development', E2E_CAPTURE_EMAILS: '1'})).toEqual([TestOtpController]);
      expect(authControllersForEnv({NODE_ENV: 'development', E2E_CAPTURE_EMAILS: 'true'})).toEqual([TestOtpController]);
    });
  });

  describe('testOtpStore', () => {
    beforeEach(() => {
      testOtpStore.clear();
    });

    it('stores and retrieves the latest OTP for an email', () => {
      testOtpStore.set('User@Example.COM', '123456');
      const retrieved = testOtpStore.get('user@example.com');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.code).toBe('123456');
      expect(retrieved?.email).toBe('user@example.com');

      // Also returns lastEntry when no email is specified
      expect(testOtpStore.get()?.code).toBe('123456');
    });

    it('returns null when no OTP exists', () => {
      expect(testOtpStore.get('nonexistent@example.com')).toBeNull();
      expect(testOtpStore.get()).toBeNull();
    });
  });

  describe('route accessibility', () => {
    let app: INestApplication;
    let http: HttpClient;

    beforeAll(async () => {
      // Default test bootApp runs under NODE_ENV=test
      ({app, http} = await bootApp());
    });

    afterAll(async () => {
      await app.close();
    });

    beforeEach(() => {
      testOtpStore.clear();
    });

    it('returns 404 when no OTP has been captured yet', async () => {
      const res = await http.get('/v1/test/otp?email=nobody@example.com');
      expect(res.status).toBe(404);
    });

    it('returns the captured OTP when recorded', async () => {
      testOtpStore.set('test@example.com', '654321');
      const res = await http.get('/v1/test/otp?email=test@example.com');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        ok: true,
        code: '654321',
        otp: '654321',
        email: 'test@example.com'
      });
    });
  });

  describe('absence in production config', () => {
    let prodApp: INestApplication;
    let prodHttp: HttpClient;

    beforeAll(async () => {
      // Boot app with NODE_ENV=production override
      ({app: prodApp, http: prodHttp} = await bootApp({
        NODE_ENV: 'production',
        PAYMENTS_PROVIDER: 'manual'
      }));
    });

    afterAll(async () => {
      await prodApp.close();
    });

    it('proves GET /v1/test/otp is strictly 404 (absent) in production config', async () => {
      testOtpStore.set('prod@example.com', '999999');
      const res = await prodHttp.get('/v1/test/otp?email=prod@example.com');
      expect(res.status).toBe(404);
    });
  });
});
