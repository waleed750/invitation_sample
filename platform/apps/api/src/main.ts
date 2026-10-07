import './instrument';
import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import helmet from 'helmet';
import {AppModule} from './app.module';
import {Logger} from 'nestjs-pino';
import {AppConfigService} from './config/app-config.service';
import {setupApp} from './setup-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {bufferLogs: true});
  const logger = app.get(Logger);
  app.useLogger(logger);
  const config = app.get(AppConfigService);

  app.use(helmet());
  // Strict CORS: only the configured web origins, no wildcards.
  app.enableCors({
    origin: config.webOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    exposedHeaders: ['x-request-id'],
    maxAge: 600
  });
  setupApp(app);
  app.enableShutdownHooks();

  await app.listen(config.port, '0.0.0.0');
  logger.log(`API listening on :${String(config.port)} (swagger=${config.swaggerEnabled ? 'on' : 'off'})`);
}

void bootstrap();
