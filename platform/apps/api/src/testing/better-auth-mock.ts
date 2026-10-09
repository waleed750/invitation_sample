/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any, @typescript-eslint/require-await, @typescript-eslint/no-unused-vars, @typescript-eslint/prefer-nullish-coalescing, @typescript-eslint/prefer-optional-chain, @typescript-eslint/no-unsafe-return */
export const betterAuth = jest.fn(() => ({
  api: {
    getSession: jest.fn().mockImplementation(async ({ headers }) => {
      const authHeader = headers?.get('authorization') || headers?.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
      const token = authHeader.split(' ')[1];
      try {
        const payloadStr = Buffer.from(token.split('.')[1], 'base64').toString();
        const payload = JSON.parse(payloadStr);
        if (payload.exp && payload.exp < Date.now() / 1000) return null;
        return {
          session: { token },
          user: { id: payload.sub }
        };
      } catch (e) {
        return null;
      }
    })
  }
}));

export const emailOTP = jest.fn();
export const phoneNumber = jest.fn();
export const bearer = jest.fn();
export const toNodeHandler = jest.fn(() => (req: any, res: any, next: any) => next());
