import './instrument';
import {NestFactory} from '@nestjs/core';
import {NestExpressApplication} from '@nestjs/platform-express';
import {AppModule} from './app.module';
import {Logger} from 'nestjs-pino';
import {AppConfigService} from './config/app-config.service';
import {setupApp} from './setup-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false
  });
  const logger = app.get(Logger);
  app.useLogger(logger);
  const config = app.get(AppConfigService);

  setupApp(app);
  app.enableShutdownHooks();

  await app.listen(config.port, '0.0.0.0');
  logger.log(`API listening on :${String(config.port)} (swagger=${config.swaggerEnabled ? 'on' : 'off'})`);
}

void bootstrap();
