import {Injectable, Optional} from '@nestjs/common';
import {PinoLogger} from 'nestjs-pino';

/**
 * Thin facade over pino used by services and the exception filter. Lines
 * inherit the per-request pino child logger (so they carry the request id and
 * are redacted) via nestjs-pino's async-local storage.
 */
@Injectable()
export class AppLogger {
  /** `pino` is always present in the running app (global `LoggerModule`); it is
   * optional only so specs can instantiate services without wiring logging. */
  constructor(@Optional() private readonly pino?: PinoLogger) {}

  log(message: unknown, context?: string): void {
    this.pino?.info(this.fields(context), String(message));
  }

  error(message: unknown, stack?: string, context?: string): void {
    this.pino?.error(this.fields(context, stack), String(message));
  }

  warn(message: unknown, context?: string): void {
    this.pino?.warn(this.fields(context), String(message));
  }

  debug(message: unknown, context?: string): void {
    this.pino?.debug(this.fields(context), String(message));
  }

  verbose(message: unknown, context?: string): void {
    this.pino?.trace(this.fields(context), String(message));
  }

  fatal(message: unknown, context?: string): void {
    this.pino?.fatal(this.fields(context), String(message));
  }

  private fields(context?: string, stack?: string): Record<string, string> {
    return {...(context === undefined ? {} : {context}), ...(stack === undefined ? {} : {stack})};
  }
}
