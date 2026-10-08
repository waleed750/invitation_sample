/** Raised when the API says the caller has no valid session (HTTP 401) or no session exists. Pages turn it into a redirect. */
export class NotSignedInError extends Error {
  constructor() {
    super('not_signed_in');
    this.name = 'NotSignedInError';
  }
}

/** A failed API call. `code` is the API's stable error code, or `unavailable` for 5xx / network failures. */
export class ApiError extends Error {
  constructor(readonly code: string, readonly status: number, message?: string) {
    super(message ?? code);
    this.name = 'ApiError';
  }
}
