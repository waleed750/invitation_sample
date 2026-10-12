import {Injectable} from '@nestjs/common';
import nodemailer, {type Transporter} from 'nodemailer';
import {AppLogger} from '../common/app-logger';
import {AppConfigService} from '../config/app-config.service';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Outbound email interface reused by auth and notifications. */
export interface EmailSender {
  send(options: SendEmailOptions): Promise<void>;
}

export const EMAIL_SENDER = 'EMAIL_SENDER';

/** Logging-only adapter that avoids PII in logs (logs subject only). */
@Injectable()
export class LogEmailSender implements EmailSender {
  constructor(private readonly logger: AppLogger) {}

  send(options: SendEmailOptions): Promise<void> {
    this.logger.log(`email dispatched (logging channel): subject="${options.subject}"`);
    return Promise.resolve();
  }
}

/** SMTP adapter using nodemailer and SMTP credentials from AppConfigService. */
@Injectable()
export class SmtpEmailSender implements EmailSender {
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(
    private readonly config: AppConfigService,
    private readonly logger: AppLogger
  ) {
    this.from = config.smtpFrom;
    this.transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass
      }
    });
  }

  async send(options: SendEmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
    this.logger.log(`email dispatched (smtp channel): subject="${options.subject}"`);
  }
}
