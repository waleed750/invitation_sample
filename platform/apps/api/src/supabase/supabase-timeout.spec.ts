import type {TestingModule} from '@nestjs/testing';
import {Test} from '@nestjs/testing';
import {createServer, type Server} from 'node:http';
import type {AddressInfo} from 'node:net';
import {AppConfigService} from '../config/app-config.service';
import {setTestEnv} from '../test-helpers';
import {SupabaseService} from './supabase.service';

setTestEnv();

/** Build the REAL service (only `AppConfigService` is stubbed) against any URL. */
async function buildService(url: string, timeoutMs: number): Promise<{moduleRef: TestingModule; service: SupabaseService}> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      SupabaseService,
      {
        provide: AppConfigService,
        useValue: {
          supabaseUrl: url,
          supabaseAnonKey: 'anon-key',
          supabaseServiceRoleKey: 'service-role-key',
          supabaseTimeoutMs: timeoutMs
        }
      }
    ]
  }).compile();
  return {moduleRef, service: moduleRef.get(SupabaseService)};
}

/** Accepts TCP connections but never responds — simulates a wedged upstream. */
async function startHangingServer(): Promise<{server: Server; url: string}> {
  const server = createServer(() => {
    // Intentionally silent.
  });
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });
  const address = server.address();
  if (typeof address === 'string' || address === null) {
    throw new Error('Hanging test server did not bind');
  }
  const {port}: AddressInfo = address;
  return {server, url: `http://127.0.0.1:${String(port)}`};
}

async function stopServer(server: Server): Promise<void> {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => {
    server.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

describe('SupabaseService resilience (real HTTP, no mocks)', () => {
  it('fails fast against a hanging upstream on both clients (no retry, hard timeout)', async () => {
    const {server, url} = await startHangingServer();
    const {moduleRef, service} = await buildService(url, 200);
    try {
      // A hanging host can only fail fast via `AbortSignal.timeout`: success
      // is impossible and postgrest's default 1s+2s+4s retry backoff would
      // take ~7s.
      for (const client of [service.forUser('test-jwt'), service.admin()]) {
        const start = Date.now();
        const result = await client.from('profiles').select('id').limit(1);
        const elapsed = Date.now() - start;
        expect(result.error).not.toBeNull();
        expect(elapsed).toBeLessThan(1500);
      }
    } finally {
      await moduleRef.close();
      await stopServer(server);
    }
  });

  it('does not retry refused connections (no 1s+2s+4s backoff)', async () => {
    const {moduleRef, service} = await buildService('http://127.0.0.1:9', 5000);
    try {
      // Refused is instant; with retries enabled this would take ~7s.
      const start = Date.now();
      const result = await service.forUser('test-jwt').from('profiles').select('id').limit(1);
      const elapsed = Date.now() - start;
      expect(result.error).not.toBeNull();
      expect(elapsed).toBeLessThan(500);
    } finally {
      await moduleRef.close();
    }
  });
});
