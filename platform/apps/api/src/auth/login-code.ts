import type {EmailSender} from './email-sender';

/** Settings the login-code delivery needs; `AppConfigService` satisfies this. */
export interface LoginCodeConfig {
  readonly isProduction: boolean;
  readonly nodeEnv: 'development' | 'production' | 'test';
  readonly emailChannel: 'smtp' | 'log';
}

export type LoginCodeSink = (line: string) => void;

export type LoginCodeDelivery = (email: string, code: string) => Promise<void>;

/**
 * Builds the function Better Auth calls to deliver a one-time sign-in code.
 *
 * - Always sends through the shared `EmailSender` (SMTP in production, the
 *   logging adapter elsewhere), so the production path is the real one.
 * - Prints the code to the API console only when `NODE_ENV=development` AND the
 *   email channel is `log` (nothing is really mailed), so a developer can sign in
 *   without a mailbox and real OTPs never reach logs when SMTP is on. It is never printed in
 *   production or test.
 */
export function createLoginCodeDelivery(
  config: LoginCodeConfig,
  emailSender: EmailSender,
  printLine: LoginCodeSink = (line) => {
    console.log(line);
  }
): LoginCodeDelivery {
  return async (email, code) => {
    await emailSender.send({
      to: email,
      subject: 'رمز الدخول / Your sign-in code',
      text: [
        `رمز الدخول الخاص بك: ${code}`,
        'ينتهي خلال 5 دقائق. لا تشاركه مع أحد.',
        '',
        `Your sign-in code: ${code}`,
        'It expires in 5 minutes. Do not share it with anyone.'
      ].join('\n')
    });
    if (config.nodeEnv === 'development' && config.emailChannel === 'log') {
      printLine(`[DEV ONLY] sign-in code for ${email}: ${code}`);
    }
  };
}
