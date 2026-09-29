import {ConsoleLogger, Injectable} from '@nestjs/common';
import {getRequestId} from './request-context';

/**
 * Console logger that appends the current request id to every line emitted
 * while handling a request. Register with `app.useLogger(new AppLogger())`
 * and enter the context in `RequestIdMiddleware`.
 */
@Injectable()
export class AppLogger extends ConsoleLogger {
  private contextWithRequestId(context?: string): string | undefined {
    const requestId = getRequestId();
    if (requestId === undefined) return context;
    return context === undefined || context === '' ? `requestId=${requestId}` : `${context} requestId=${requestId}`;
  }

  override log(message: unknown, context?: string): void {
    super.log(message, this.contextWithRequestId(context));
  }

  override error(message: unknown, stack?: string, context?: string): void {
    super.error(message, stack, this.contextWithRequestId(context));
  }

  override warn(message: unknown, context?: string): void {
    super.warn(message, this.contextWithRequestId(context));
  }

  override debug(message: unknown, context?: string): void {
    super.debug(message, this.contextWithRequestId(context));
  }

  override verbose(message: unknown, context?: string): void {
    super.verbose(message, this.contextWithRequestId(context));
  }

  override fatal(message: unknown, context?: string): void {
    super.fatal(message, this.contextWithRequestId(context));
  }
}
