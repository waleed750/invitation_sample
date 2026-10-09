export function isAuthConfigured(): boolean {
  // Better Auth just needs the API URL which is always set
  return process.env.NEXT_PUBLIC_API_URL !== undefined && process.env.NEXT_PUBLIC_API_URL.trim() !== '';
}

export function isApiCommerceMode(): boolean {
  return process.env.COMMERCE_MODE === 'api';
}
