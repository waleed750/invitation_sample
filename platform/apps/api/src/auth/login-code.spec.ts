import {createLoginCodeDelivery, type LoginCodeConfig} from './login-code';
import type {EmailSender, SendEmailOptions} from './email-sender';

function setup(config: LoginCodeConfig) {
  const sent: SendEmailOptions[] = [];
  const printed: string[] = [];
  const sender: EmailSender = {
    send: (options) => {
      sent.push(options);
      return Promise.resolve();
    }
  };
  const deliver = createLoginCodeDelivery(config, sender, (line) => printed.push(line));
  return {deliver, sent, printed};
}

describe('createLoginCodeDelivery', () => {
  it('emails the code in Arabic and English', async () => {
    const {deliver, sent} = setup({isProduction: true, nodeEnv: 'production'});
    await deliver('a@example.test', '123456');
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe('a@example.test');
    expect(sent[0]?.text).toContain('123456');
    expect(sent[0]?.text).toMatch(/رمز الدخول/);
    expect(sent[0]?.text).toMatch(/sign-in code/);
  });

  it('prints the code in development only', async () => {
    const dev = setup({isProduction: false, nodeEnv: 'development'});
    await dev.deliver('a@example.test', '654321');
    expect(dev.printed).toEqual(['[DEV ONLY] sign-in code for a@example.test: 654321']);
  });

  it('never prints the code in production', async () => {
    const prod = setup({isProduction: true, nodeEnv: 'production'});
    await prod.deliver('a@example.test', '654321');
    expect(prod.printed).toEqual([]);
  });

  it('never prints the code under test', async () => {
    const test = setup({isProduction: false, nodeEnv: 'test'});
    await test.deliver('a@example.test', '654321');
    expect(test.printed).toEqual([]);
  });
});
