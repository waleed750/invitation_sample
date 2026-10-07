import createClient, {type Middleware} from 'openapi-fetch';
import type {paths} from './schema';

export type {paths, components, operations} from './schema';

export interface ApiClientOptions {
  /** API origin, e.g. `https://api.example.com` (routes already include `/v1`). */
  baseUrl: string;
  /** Returns the current Supabase access token, or null/undefined when signed out. */
  getAccessToken?: () => string | null | undefined | Promise<string | null | undefined>;
  fetch?: typeof fetch;
}

/** Typed REST client for the platform API. Adds `Authorization: Bearer <token>` when a token exists. */
export function createApiClient(options: ApiClientOptions) {
  const client = createClient<paths>({
    baseUrl: options.baseUrl,
    ...(options.fetch ? {fetch: options.fetch} : {})
  });
  const {getAccessToken} = options;
  if (getAccessToken) {
    const auth: Middleware = {
      async onRequest({request}) {
        const token = await getAccessToken();
        if (token) request.headers.set('Authorization', `Bearer ${token}`);
        return request;
      }
    };
    client.use(auth);
  }
  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;
