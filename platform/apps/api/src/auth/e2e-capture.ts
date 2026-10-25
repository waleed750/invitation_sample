import type {Express, Request, Response} from 'express';
import type {LoginCodeDelivery} from './login-code';

const MAX_ENTRIES = 200;

/** Keeps the most recent sign-in code per address. Test use only (E2E_CAPTURE_EMAILS=1). */
export class LoginCodeCapture {
  private readonly codes = new Map<string, string>();

  record(email: string, code: string): void {
    const key = email.trim().toLowerCase();
    this.codes.delete(key);
    this.codes.set(key, code);
    if (this.codes.size > MAX_ENTRIES) {
      const oldest = this.codes.keys().next().value;
      if (oldest !== undefined) this.codes.delete(oldest);
    }
  }

  latest(email: string): string | undefined {
    return this.codes.get(email.trim().toLowerCase());
  }

  /** Wraps the real delivery so the code is still sent as normal. */
  wrap(inner: LoginCodeDelivery): LoginCodeDelivery {
    return async (email, code) => {
      this.record(email, code);
      await inner(email, code);
    };
  }
}

/** GET /v1/__e2e/last-code?email=... -> {code}. Only mounted when capture is enabled. */
export function mountLoginCodeCapture(server: Pick<Express, 'get'>, capture: LoginCodeCapture): void {
  server.get('/v1/__e2e/last-code', (request: Request, response: Response) => {
    const email = typeof request.query.email === 'string' ? request.query.email : '';
    const code = email ? capture.latest(email) : undefined;
    if (code === undefined) {
      response.status(404).json({error: {code: 'not_found'}});
      return;
    }
    response.json({code});
  });
}
