import { createAuthClient } from 'better-auth/react';
import { emailOTPClient, phoneNumberClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || ''}/v1/auth`,
  plugins: [
    emailOTPClient(),
    phoneNumberClient()
  ]
});
