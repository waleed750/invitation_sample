import {Injectable} from '@nestjs/common';
import {createHmac} from 'node:crypto';
import {AppLogger} from '../common/app-logger';
import {AppConfigService} from '../config/app-config.service';

const ATTEMPTS = 3;
const TIMEOUT_MS = 3000;
const BASE_DELAY_MS = 200;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Tells the web app to refresh a published invitation page (`POST WEB_REVALIDATE_URL`,
 * body `{type:'invitation', slug}`, header `x-signature` = hex HMAC-SHA256 of the raw body
 * keyed with REVALIDATE_SECRET). Fire-and-forget: never throws, never blocks the caller.
 */
@Injectable()
export class RevalidationService {
  constructor(
    private readonly config: AppConfigService,
    private readonly logger: AppLogger
  ) {}

  /** Returns immediately; delivery (with retries) runs in the background. */
  revalidateInvitation(slug: string): void {
    void this.deliver(slug);
  }

  /** Resolves when delivery finished (or was given up on). Never rejects. */
  async deliver(slug: string): Promise<void> {
    try {
      const url = this.config.webRevalidateUrl;
      const secret = this.config.revalidateSecret;
      if (url === undefined || secret === undefined) {
        this.logger.log('revalidation disabled (WEB_REVALIDATE_URL not set); skipped');
        return;
      }
      const body = JSON.stringify({type: 'invitation', slug});
      const signature = createHmac('sha256', secret).update(body).digest('hex');
      for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
        if (await this.post(url, body, signature)) return;
        if (attempt < ATTEMPTS) {
          await sleep(BASE_DELAY_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * BASE_DELAY_MS));
        }
      }
      this.logger.warn(`revalidation failed after ${String(ATTEMPTS)} attempts`);
    } catch {
      this.logger.warn('revalidation failed (unexpected error)');
    }
  }

  private async post(url: string, body: string, signature: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-signature': signature},
        body,
        signal: AbortSignal.timeout(TIMEOUT_MS)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
